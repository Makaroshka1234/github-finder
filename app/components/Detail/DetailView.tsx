'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { DetailLayout, type DetailConfig } from './DetailLayout';

interface DetailViewProps<T> {
  /** Опції з @/app/lib/api — key і fetch живуть там, не тут */
  query: UseQueryOptions<T, Error, T>;
  /** Мапить типізовані дані сторінки у спільний конфіг лейауту */
  config: (data: T) => DetailConfig;
}

export function DetailView<T>({ query, config }: DetailViewProps<T>) {
  const { data, isLoading, error } = useQuery(query);

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center">No data</div>;
  }

  return <DetailLayout {...config(data)} />;
}
