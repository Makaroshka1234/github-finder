'use client';

import { useRef } from 'react';
import { LoadingSkeletons } from './LoadingSkeletons';
import { ResultsError } from './ResultsError';
import { ResultsEmpty } from './ResultsEmpty';
import { ResultsHeader } from './ResultsHeader';
import { ResultCard } from '../Cards';
import { useInfiniteScroll } from '@/app/hooks/useInfiniteScroll';
import { SEARCH_CONFIG } from '@/app/constants/config';
import type { SearchType, SearchResult } from '@/app/types';

interface ResultsGridProps {
  allResults: SearchResult[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchType: SearchType;
  query: string;
  totalCount: number;
  currentPage: number;
  loadMore: (query: string, searchType: SearchType, page: number) => void;
}

export function ResultsGrid({
  allResults,
  isLoading,
  isLoadingMore,
  error,
  searchType,
  query,
  totalCount,
  currentPage,
  loadMore,
}: ResultsGridProps) {
  const observerTarget = useRef<HTMLDivElement | null>(null);

  useInfiniteScroll({
    targetRef: observerTarget,
    isLoading: isLoadingMore,
    hasMore: totalCount > allResults.length,
    onLoad: () => loadMore(query, searchType, currentPage + 1),
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

  if (allResults.length === 0) {
    return <ResultsEmpty searchType={searchType} />;
  }

  return (
    <div>
      <ResultsHeader totalCount={totalCount} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allResults.map((item) => (
          <div key={item.id}>
            <ResultCard item={item} />
          </div>
        ))}
      </div>
      {isLoadingMore && <LoadingSkeletons />}
      <div ref={observerTarget} />
    </div>
  );
}
