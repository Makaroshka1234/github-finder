// Server-only: тягне токени і Redis. Імпортувати лише з route handlers
// та Server Components, ніколи з 'use client'-модулів.
import { getRepositoryDetail as getGitHubRepoDetail, getUserDetail as getGitHubUserDetail } from '@/lib/github';
import { getRepositoryDetail as getGitLabRepoDetail, getUserDetail as getGitLabUserDetail } from '@/lib/gitlab';
import { getCache, setCache } from '@/lib/redis';
import type { RepositoryDetail, UserDetail, SourceType } from '@/app/types';

const CACHE_TTL = 60 * 60; // 1 година

/** `cached` потрібен роутам для заголовка x-cache */
export interface DetailResult<T> {
  data: T;
  cached: boolean;
}

export function isValidSource(source: string): source is SourceType {
  return source === 'github' || source === 'gitlab';
}

export async function loadRepositoryDetail(
  source: SourceType,
  owner: string,
  name: string
): Promise<DetailResult<RepositoryDetail>> {
  const cacheKey = `detail:repository:${source}:${owner}:${name}`;

  const cached = await getCache<RepositoryDetail>(cacheKey, 'repository', source);
  if (cached) {
    return { data: cached, cached: true };
  }

  const data =
    source === 'github'
      ? await getGitHubRepoDetail(owner, name)
      : await getGitLabRepoDetail(`${owner}/${name}`);

  await setCache(cacheKey, 'repository', data, CACHE_TTL, source);

  return { data, cached: false };
}

export async function loadUserDetail(
  source: SourceType,
  login: string
): Promise<DetailResult<UserDetail>> {
  const cacheKey = `detail:user:${source}:${login}`;

  const cached = await getCache<UserDetail>(cacheKey, 'user', source);
  if (cached) {
    return { data: cached, cached: true };
  }

  const data =
    source === 'github'
      ? await getGitHubUserDetail(login)
      : await getGitLabUserDetail(login);

  await setCache(cacheKey, 'user', data, CACHE_TTL, source);

  return { data, cached: false };
}
