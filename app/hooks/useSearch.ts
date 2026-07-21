'use client';

import { useCallback, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import { useSearchStore } from '@/app/store/searchStore';
import { useStoreActions } from './useStoreActions';
import { SEARCH_CONFIG } from '@/app/constants/config';
import type { SearchType, SearchResponse, SourceType } from '@/app/types';

const SEARCH_API_URL = '/api/search';

export function useSearch() {
  const sourceType = useSearchStore((state) => state.sourceType);
  const {
    setLoading,
    setResults,
    setAllResults,
    appendResults,
    setError,
    setTotalCount,
    setCurrentPage,
    setIsLoadingMore,
  } = useStoreActions();

  const requestIdRef = useRef(0);

  const clearResults = useCallback(() => {
    setResults([]);
    setAllResults([]);
    setTotalCount(0);
    setError(null);
    setCurrentPage(1);
  }, [setResults, setAllResults, setTotalCount, setError, setCurrentPage]);

  const performSearch = useCallback(
    async (query: string, searchType: SearchType, requestId: number, page: number = 1, source: SourceType = 'all') => {
      const isInitial = page === 1;
      if (isInitial) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const response = await fetch(SEARCH_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            type: searchType,
            page,
            source,
          }),
        });

        if (!response.ok) {
          throw new Error(`Помилка запиту: ${response.status} ${response.statusText}`);
        }

        const data: SearchResponse = await response.json();
        if (requestIdRef.current !== requestId) return;

        if (isInitial) {
          setResults(data.items || []);
          setAllResults(data.items || []);
          setCurrentPage(1);
        } else {
          appendResults(data.items || []);
          setCurrentPage(page);
        }
        setTotalCount(data.total_count || 0);
      } catch (error) {
        if (requestIdRef.current !== requestId) return;

        const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
        setError(errorMessage);
        if (isInitial) {
          clearResults();
        }
        setTotalCount(0);
      } finally {
        if (requestIdRef.current === requestId) {
          if (isInitial) {
            setLoading(false);
          } else {
            setIsLoadingMore(false);
          }
        }
      }
    },
    [setLoading, setError, setResults, setAllResults, appendResults, setTotalCount, setCurrentPage, setIsLoadingMore, clearResults]
  );

  const debouncedSearchRef = useRef<any>(null);

  useEffect(() => {
    debouncedSearchRef.current = debounce(performSearch, SEARCH_CONFIG.DEBOUNCE_MS);

    return () => {
      debouncedSearchRef.current?.cancel();
    };
  }, [performSearch]);

  const fetchResults = useCallback(
    (query: string, searchType: SearchType) => {
      const trimmedQuery = query.trim();

      if (trimmedQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        debouncedSearchRef.current?.cancel();
        clearResults();
        setLoading(false);
        return;
      }

      requestIdRef.current += 1;
      debouncedSearchRef.current(trimmedQuery, searchType, requestIdRef.current, 1, sourceType);
    },
    [clearResults, setLoading, sourceType]
  );

  const loadMore = useCallback(
    (query: string, searchType: SearchType, page: number) => {
      requestIdRef.current += 1;
      performSearch(query, searchType, requestIdRef.current, page, sourceType);
    },
    [performSearch, sourceType]
  );

  return { fetchResults, loadMore };
}
