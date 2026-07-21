import { NextRequest, NextResponse } from 'next/server';
import { searchGitHub } from '@/lib/github';
import { searchGitLab } from '@/lib/gitlab';
import { getCache, setCache, getCacheKey, checkRateLimit } from '@/lib/redis';
import { SEARCH_CONFIG } from '@/app/constants/config';
import type { SearchResponse } from '@/app/types';

// Результат одного джерела: успішна відповідь або заглушка з помилкою (з catch)
type SourceResult = SearchResponse & { error?: string; source?: string };

// Ліміт: 30 запитів на IP за 60 секунд
const RATE_LIMIT = 30;
const RATE_WINDOW_SECONDS = 60;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`search:${ip}`, RATE_LIMIT, RATE_WINDOW_SECONDS);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(RATE_WINDOW_SECONDS),
            'X-RateLimit-Limit': String(rate.limit),
            'X-RateLimit-Remaining': String(rate.remaining),
          },
        }
      );
    }

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
      const cachedAggregate = await getCache<SearchResponse>(query, type, 'all');
      if (cachedAggregate) {
        return NextResponse.json(cachedAggregate, { headers: { 'x-cache': 'HIT' } });
      }
    }

    // Fetch from all sources in parallel
    const results: SourceResult[] = await Promise.all([
      searchGitHub(query, type, page)
        .catch((err: Error): SourceResult => ({
          items: [],
          total_count: 0,
          error: err.message,
          source: 'github',
        })),
      searchGitLab(query, type, page)
        .catch((err: Error): SourceResult => ({
          items: [],
          total_count: 0,
          error: err.message,
          source: 'gitlab',
        })),
    ]);

    // Aggregate results
    const allItems = results.flatMap((r) => r.items || []);
    const totalCount = results.reduce((sum, r) => sum + (r.total_count || 0), 0);
    const errors = results
      .filter((r) => r.error)
      .map((r) => ({ source: r.source, error: r.error }));

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
