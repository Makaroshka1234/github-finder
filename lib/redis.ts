import Redis from 'ioredis';
import { SEARCH_CONFIG } from '@/app/constants/config';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => console.error('[Redis] Connection error:', err));

export function getCacheKey(query: string, type: string, source: string = 'gh'): string {
  return `${source}:${type}:${query.toLowerCase()}`;
}

export async function getCache<T>(query: string, type: string, source: string = 'gh'): Promise<T | null> {
  try {
    const key = getCacheKey(query, type, source);
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error('Redis getCache error:', error);
    return null;
  }
}

export async function setCache(
  query: string,
  type: string,
  data: any,
  ttl: number = SEARCH_CONFIG.CACHE_TTL_SECONDS,
  source: string = 'gh'
): Promise<void> {
  try {
    const key = getCacheKey(query, type, source);
    const serialized = JSON.stringify(data);
    await redis.setex(key, ttl, serialized);
  } catch (error) {
    console.error('[Redis] ❌ setCache error:', error);
  }
}

export async function deleteCache(query: string, type: string, source: string = 'gh'): Promise<void> {
  try {
    const key = getCacheKey(query, type, source);
    await redis.del(key);
  } catch (error) {
    console.error('[Redis] deleteCache error:', error);
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    await redis.flushdb();
  } catch (error) {
    console.error('Redis clearAllCache error:', error);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
}

/**
 * Fixed-window rate limiter на Redis (INCR + EXPIRE).
 * Перший запит у вікні ставить TTL; далі лічильник інкрементиться до ліміту.
 * Fail-open: якщо Redis недоступний — пропускаємо (не блокуємо користувачів через збій кешу).
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
      limit,
    };
  } catch (error) {
    console.error('[Redis] rate limit error:', error);
    return { success: true, remaining: limit, limit };
  }
}
