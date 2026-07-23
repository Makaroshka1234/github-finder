'use client';

import { useCallback, useRef } from 'react';
import { LoadingSkeletons } from './LoadingSkeletons';
import { ResultsError } from './ResultsError';
import { ResultsEmpty } from './ResultsEmpty';
import { ResultsHeader } from './ResultsHeader';
import { ResultCard } from '../Cards';
import { useInfiniteScroll } from '@/app/hooks/useInfiniteScroll';
import { SEARCH_CONFIG } from '@/app/constants/config';
import type { SearchType, SearchResult } from '@/app/types';

interface ResultsGridProps {
  results: SearchResult[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  error: string | null;
  searchType: SearchType;
  query: string;
  totalCount: number;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}

export function ResultsGrid({
  results,
  isLoading,
  isFetchingNextPage,
  error,
  searchType,
  query,
  totalCount,
  hasNextPage,
  fetchNextPage,
}: ResultsGridProps) {
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Номер сторінки веде сам useInfiniteQuery через getNextPageParam
  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  useInfiniteScroll({
    targetRef: observerTarget,
    isLoading: isFetchingNextPage,
    hasMore: hasNextPage,
    onLoad: handleLoadMore,
  });

  if (isLoading) {
    return <LoadingSkeletons />;
  }

  if (error) {
    return <ResultsError error={error} />;
  }

  if (query.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    return null;
  }

  if (results.length === 0) {
    return <ResultsEmpty searchType={searchType} />;
  }

  return (
    <div>
      <ResultsHeader totalCount={totalCount} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((item) => (
          <div key={`${item.source}-${item.id}`}>
            <ResultCard item={item} />
          </div>
        ))}
      </div>
      {isFetchingNextPage && <LoadingSkeletons />}
      <div ref={observerTarget} />
    </div>
  );
}
