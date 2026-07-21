import { NextRequest, NextResponse } from 'next/server';
import { searchGitHub } from '@/lib/github';
import { searchGitLab } from '@/lib/gitlab';
import { getCache, setCache, getCacheKey } from '@/lib/redis';
import { SEARCH_CONFIG } from '@/app/constants/config';
import type { SearchResponse } from '@/app/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type, page = 1, source = 'all' } = body;

    if (typeof query !== 'string' || query.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      return NextResponse.json(
        { error: 'Query must be a string with at least 3 characters' },
        { status: 400 }
      );
    }

    if (type !== 'user' && type !== 'repo') {
      return NextResponse.json(
        { error: "Type must be 'user' or 'repo'" },
        { status: 400 }
      );
    }

    
    if (source !== 'all') {
      const cacheKey = page === 1 ? getCacheKey(query, type, source) : null;

      if (cacheKey) {
        const cached = await getCache<SearchResponse>(query, type, source);
        if (cached) {
          return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });
        }
      }

      let results: SearchResponse;
      if (source === 'github') {
        results = await searchGitHub(query, type, page);
      } else if (source === 'gitlab') {
        results = await searchGitLab(query, type, page);
      } else {
        throw new Error(`Unknown source: ${source}`);
      }

      if (cacheKey) {
        await setCache(query, type, results, SEARCH_CONFIG.CACHE_TTL_SECONDS, source);
      }

      return NextResponse.json(results, { headers: { 'x-cache': cacheKey ? 'MISS' : 'SKIP' } });
    }

    // Multi-source aggregated search (cache only page 1)
    const aggregateKey = page === 1 ? getCacheKey(query, type, 'all') : null;

    if (aggregateKey) {
      const cachedAggregate = await getCache<any>(query, type, 'all');
      if (cachedAggregate) {
        return NextResponse.json(cachedAggregate, { headers: { 'x-cache': 'HIT' } });
      }
    }

    // Fetch from all sources in parallel
    const results = await Promise.all([
      searchGitHub(query, type, page)
        .catch((err: Error) => ({
          items: [],
          total_count: 0,
          error: err.message,
          source: 'github',
        })),
      searchGitLab(query, type, page)
        .catch((err: Error) => ({
          items: [],
          total_count: 0,
          error: err.message,
          source: 'gitlab',
        })),
    ]);

    // Aggregate results
    const allItems = results.flatMap((r: any) => r.items || []);
    const totalCount = results.reduce((sum: number, r: any) => sum + (r.total_count || 0), 0);
    const errors = results.filter((r: any) => r.error).map((r: any) => ({ source: r.source, error: r.error }));

    const aggregatedResult = {
      items: allItems,
      total_count: totalCount,
      ...(errors.length > 0 && { errors }),
    };

    if (aggregateKey) {
      await setCache(query, type, aggregatedResult, SEARCH_CONFIG.CACHE_TTL_SECONDS, 'all');
    }

    return NextResponse.json(aggregatedResult, { headers: { 'x-cache': 'MISS' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
