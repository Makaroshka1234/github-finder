/**
 * Єдина точка входу для всіх запитів фронта до нашого бекенду.
 *
 * Компоненти й хуки не викликають fetch напряму — тільки функції звідси.
 * Тут же живуть queryKey і queryOptions для TanStack Query, щоб ключ
 * не дублювався між клієнтським useQuery і серверним prefetch у page.tsx
 * (розʼїхані ключі = hydration промахується і дані фетчаться двічі).
 */

import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import type {
  Favorite,
  RepositoryDetail,
  SearchResponse,
  SearchType,
  SnapshotData,
  SourceType,
  UserDetail,
} from '@/app/types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Кидає ApiError на не-2xx, підхоплюючи { error } з тіла — роути віддають
 * саме таку форму, тож користувач бачить "Too many requests", а не "429".
 * Порожнє тіло (204 від DELETE) не ламає парсер.
 */
async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, body?.error || `${res.status} ${res.statusText}`);
  }

  return body as T;
}

function jsonRequest(method: 'POST' | 'PUT' | 'PATCH', payload: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

/* ---------------------------------- Search --------------------------------- */

export interface SearchParams {
  query: string;
  type: SearchType;
  page: number;
  source: SourceType;
}

export function search(params: SearchParams): Promise<SearchResponse> {
  return apiFetch<SearchResponse>('/api/search', jsonRequest('POST', params));
}

/* -------------------------------- Favorites -------------------------------- */

export interface CreateFavoritePayload {
  source: 'github' | 'gitlab';
  itemType: 'repository' | 'user';
  externalId: string;
  snapshotData: SnapshotData;
}

export function getFavorites(): Promise<Favorite[]> {
  return apiFetch<Favorite[]>('/api/favorites');
}

export function createFavorite(payload: CreateFavoritePayload): Promise<Favorite> {
  return apiFetch<Favorite>('/api/favorites', jsonRequest('POST', payload));
}

export function deleteFavorite(id: string): Promise<void> {
  return apiFetch<void>(`/api/favorites/${id}`, { method: 'DELETE' });
}

/* ------------------------------ Detail (HTTP) ------------------------------ */

export function getRepositoryDetail(
  source: string,
  owner: string,
  name: string
): Promise<RepositoryDetail> {
  return apiFetch<RepositoryDetail>(`/api/repository/${source}/${owner}/${name}`);
}

export function getUserDetail(source: string, login: string): Promise<UserDetail> {
  return apiFetch<UserDetail>(`/api/user/${source}/${login}`);
}

/* ----------------------------- TanStack Query ------------------------------ */

/** Єдине джерело правди для ключів — імпортується і клієнтом, і page.tsx.
    Тип навмисно розширений до readonly unknown[]: вузький tuple інваріантний
    і не присвоюється в UseQueryOptions у generic-компоненті. */
export const queryKeys = {
  repositoryDetail: (source: string, owner: string, name: string): readonly unknown[] => [
    'repository',
    source,
    owner,
    name,
  ],
  userDetail: (source: string, login: string): readonly unknown[] => ['user', source, login],
  // Ключ під користувачем: браузерний QueryClient — синглтон на всю сесію,
  // тож під плоским ['favorites'] після зміни акаунта віддались би чужі дані
  favorites: (userKey: string): readonly unknown[] => ['favorites', userKey],
  search: (type: SearchType, source: SourceType, query: string): readonly unknown[] => [
    'search',
    type,
    source,
    query,
  ],
};

export function repositoryDetailQuery(source: string, owner: string, name: string) {
  return queryOptions({
    queryKey: queryKeys.repositoryDetail(source, owner, name),
    queryFn: () => getRepositoryDetail(source, owner, name),
    // GitHub рахує commit-статистику асинхронно (202 → пустий масив, поки не порахує).
    // Поки чекаємо — перепитуємо кожні 30с (стільки ж живе "ще рахується" запис у
    // нашому Redis-кеші, див. COMPUTING_STATS_CACHE_TTL у app/lib/detailData.ts,
    // інакше перші кілька опитувань просто отримали б той самий кеш-хіт з бекенду).
    // Здаємось після 5 спроб, щоб не довбати нескінченно, якщо GitHub так і не порахує.
    refetchInterval: (query) => {
      const data = query.state.data;
      const stillComputing = source === 'github' && data && data.commitActivity.length === 0;
      if (!stillComputing || query.state.dataUpdateCount >= 5) return false;
      return 30_000;
    },
  });
}

export function userDetailQuery(source: string, login: string) {
  return queryOptions({
    queryKey: queryKeys.userDetail(source, login),
    queryFn: () => getUserDetail(source, login),
  });
}

export function searchInfiniteQuery(type: SearchType, source: SourceType, query: string) {
  return infiniteQueryOptions({
    queryKey: queryKeys.search(type, source, query),
    queryFn: ({ pageParam }) => search({ query, type, page: pageParam, source }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: SearchResponse, allPages: SearchResponse[]) => {
      // Порожня сторінка — стоп. Без цього великий total_count (GitHub віддає
      // мільйони, а реально пагінує до 1000) крутив би нескінченний цикл.
      if (lastPage.items.length === 0) return undefined;
      const loaded = allPages.reduce((n, page) => n + page.items.length, 0);
      return loaded < lastPage.total_count ? allPages.length + 1 : undefined;
    },
  });
}
