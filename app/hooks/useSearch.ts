'use client';

import { useInfiniteQuery, keepPreviousData, type InfiniteData } from '@tanstack/react-query';
import { useSearchStore } from '@/app/store/searchStore';
import { useDebouncedValue } from './useDebouncedValue';
import { SEARCH_CONFIG } from '@/app/constants/config';
import { searchInfiniteQuery } from '@/app/lib/api';
import type { SearchResponse, SearchResult } from '@/app/types';

interface SelectedSearch {
  results: SearchResult[];
  totalCount: number;
}

/**
 * Модульного рівня навмисно: інлайновий select пересоздавався б щорендера
 * і ламав мемоїзацію TanStack, ганяючи дедуплікацію на кожен рендер.
 *
 * Дедуп потрібен для source='all' — GitHub і GitLab пагінуються незалежно,
 * тож той самий елемент може прийти в різних сторінках.
 */
function selectSearchResults(data: InfiniteData<SearchResponse>): SelectedSearch {
  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const page of data.pages) {
    for (const item of page.items) {
      const key = `${item.source}-${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(item);
    }
  }

  return { results, totalCount: data.pages[0]?.total_count ?? 0 };
}

export function useSearch() {
  const query = useSearchStore((state) => state.query);
  const searchType = useSearchStore((state) => state.searchType);
  const sourceType = useSearchStore((state) => state.sourceType);

  const debouncedQuery = useDebouncedValue(query, SEARCH_CONFIG.DEBOUNCE_MS);
  const trimmedQuery = debouncedQuery.trim();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    error,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    ...searchInfiniteQuery(searchType, sourceType, trimmedQuery),
    enabled: trimmedQuery.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH,
    // Старі результати лишаються на екрані, поки вантажаться нові —
    // без блимання скелетонів на кожній літері
    placeholderData: keepPreviousData,
    // Бекенд і так тримає Redis-кеш 2 год; повернення до попереднього
    // запиту в межах цього вікна віддається миттєво з памʼяті
    staleTime: 5 * 60 * 1000,
    select: selectSearchResults,
  });

  return {
    results: data?.results ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    isFetchingNextPage,
    // ResultsError чекає рядок; ApiError несе текст { error } з роута,
    // тож користувач бачить "Too many requests", а не "429"
    error: error ? error.message : null,
    fetchNextPage,
    hasNextPage,
  };
}
