'use client';

import { useEffect } from 'react';

interface UseInfiniteScrollOptions {
  targetRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  hasMore: boolean;
  onLoad: () => void;
}

export function useInfiniteScroll({
  targetRef,
  isLoading,
  hasMore,
  onLoad,
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    if (!targetRef.current || isLoading || !hasMore) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        onLoad();
      }
    });

    observer.observe(targetRef.current);
    return () => observer.disconnect();
  }, [isLoading, hasMore, onLoad, targetRef]);
}
