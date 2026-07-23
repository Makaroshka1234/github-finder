import { Suspense } from 'react';
import { dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/app/lib/queryClient';
import { loadRepositoryDetail, isValidSource } from '@/app/lib/detailData';
import { queryKeys } from '@/app/lib/api';
import RepositoryDetailView from './RepositoryDetailView';

interface Props {
  params: Promise<{
    source: string;
    owner: string;
    name: string;
  }>;
}

export async function generateMetadata({ params }: Props) {
  const { source, owner, name } = await params;
  return {
    title: `${owner}/${name} - GitHub Finder`,
    description: `Repository details for ${owner}/${name} on ${source}`,
  };
}

export default async function RepositoryPage({ params }: Props) {
  const { source, owner, name } = await params;
  const queryClient = getQueryClient();

  // Prefetch напряму через loader — без HTTP-запиту до самих себе
  // (відносний URL у fetch() на сервері не парситься).
  if (isValidSource(source)) {
    try {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.repositoryDetail(source, owner, name),
        queryFn: async () => (await loadRepositoryDetail(source, owner, name)).data,
        staleTime: 1000 * 60,
      });
    } catch (error) {
      console.error(`Failed to prefetch repository ${source}/${owner}/${name}:`, error);
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div className="p-8 text-center">Loading repository details...</div>}>
        <RepositoryDetailView source={source} owner={owner} name={name} />
      </Suspense>
    </HydrationBoundary>
  );
}
