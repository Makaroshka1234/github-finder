// Server-only: тягне токени і Redis. Імпортувати лише з route handlers
// та Server Components, ніколи з 'use client'-модулів.
import { getRepositoryDetail as getGitHubRepoDetail, getUserDetail as getGitHubUserDetail } from '@/lib/github';
import { getRepositoryDetail as getGitLabRepoDetail, getUserDetail as getGitLabUserDetail } from '@/lib/gitlab';
import { getCache, setCache } from '@/lib/redis';
import type { RepositoryDetail, UserDetail, SourceType } from '@/app/types';

const CACHE_TTL = 60 * 60; // 1 година
// GitHub рахує commit-статистику асинхронно (202 Accepted, повертає пустий масив,
// поки не порахує). Якщо кешувати цей "ще рахую" стан на годину, юзер застрягає
// на "Computing statistics…" аж до спливання кешу, навіть коли GitHub уже готовий.
const COMPUTING_STATS_CACHE_TTL = 30; // секунд

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

  // Та сама евристика, що й у RepositoryDetailView для тексту "Computing…":
  // порожній commitActivity у GitHub означає "статистика ще рахується", а не
  // "комітів немає" — GitLab такого нюансу не має, там порожньо завжди по-справжньому.
  const stillComputingStats = source === 'github' && data.commitActivity.length === 0;
  const ttl = stillComputingStats ? COMPUTING_STATS_CACHE_TTL : CACHE_TTL;

  await setCache(cacheKey, 'repository', data, ttl, source);

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
