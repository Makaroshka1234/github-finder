import { NextRequest, NextResponse } from 'next/server';
import { searchGitHub } from '@/lib/github';
import { getCache, setCache } from '@/lib/redis';
import { SEARCH_CONFIG } from '@/app/constants/config';
import type { SearchResponse } from '@/app/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type, page = 1 } = body;

    console.log('API /search received:', { query, type, page, bodyKeys: Object.keys(body) });

    if (typeof query !== 'string' || query.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      console.log('Query validation failed:', { query, length: query?.length });
      return NextResponse.json(
        { error: 'Query must be a string with at least 3 characters' },
        { status: 400 }
      );
    }

    if (type !== 'user' && type !== 'repo') {
      console.log('Type validation failed:', { type, validValues: ['user', 'repo'] });
      return NextResponse.json(
        { error: "Type must be 'user' or 'repo'" },
        { status: 400 }
      );
    }

    const cacheKey = page === 1 ? `${query}:${type}` : null;
    if (cacheKey) {
      console.log('🔍 Checking cache for:', query, type);
      const cached = await getCache<SearchResponse>(query, type);
      if (cached) {
        console.log('✅ Cache HIT for:', query, type);
        return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });
      }
      console.log('❌ Cache MISS for:', query, type);
    }

    const results = await searchGitHub(query, type, page);

    if (cacheKey) {
      console.log('💾 Saving to cache:', query, type, 'items:', results.items?.length);
      await setCache(query, type, results, SEARCH_CONFIG.CACHE_TTL_SECONDS);
    }

    return NextResponse.json(results, { headers: { 'x-cache': cacheKey ? 'MISS' : 'SKIP' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
