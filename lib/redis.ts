import { Redis } from '@upstash/redis';
import { SEARCH_CONFIG } from '@/app/constants/config';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export function getCacheKey(query: string, type: string): string {
  return `gh:${type}:${query.toLowerCase()}`;
}

export async function getCache<T>(query: string, type: string): Promise<T | null> {
  try {
    const key = getCacheKey(query, type);
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch (error) {
    console.error('Redis getCache error:', error);
    return null;
  }
}

export async function setCache(
  query: string,
  type: string,
  data: any,
  ttl: number = SEARCH_CONFIG.CACHE_TTL_SECONDS
): Promise<void> {
  try {
    const key = getCacheKey(query, type);
    console.log('[Redis] Setting cache key:', key, 'TTL:', ttl, 'size:', JSON.stringify(data).length);
    await redis.set(key, JSON.stringify(data), { ex: ttl });
    console.log('[Redis] ✅ Cache set successfully');
  } catch (error) {
    console.error('[Redis] ❌ setCache error:', error);
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    await redis.flushdb();
  } catch (error) {
    console.error('Redis clearAllCache error:', error);
  }
}
