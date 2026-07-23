import { Suspense } from 'react';
import { dehydrate } from '@tanstack/react-query';
import { HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/app/lib/queryClient';
import { loadUserDetail, isValidSource } from '@/app/lib/detailData';
import { queryKeys } from '@/app/lib/api';
import UserDetailView from './UserDetailView';

interface Props {
  params: Promise<{
    source: string;
    login: string;
  }>;
}

export async function generateMetadata({ params }: Props) {
  const { login, source } = await params;
  return {
    title: `${login} - GitHub Finder`,
    description: `User profile for ${login} on ${source}`,
  };
}

export default async function UserPage({ params }: Props) {
  const { source, login } = await params;
  const queryClient = getQueryClient();

  // Prefetch напряму через loader — без HTTP-запиту до самих себе
  // (відносний URL у fetch() на сервері не парситься).
  if (isValidSource(source)) {
    try {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.userDetail(source, login),
        queryFn: async () => (await loadUserDetail(source, login)).data,
        staleTime: 1000 * 60,
      });
    } catch (error) {
      console.error(`Failed to prefetch user ${source}/${login}:`, error);
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div className="p-8 text-center">Loading user details...</div>}>
        <UserDetailView source={source} login={login} />
      </Suspense>
    </HydrationBoundary>
  );
}
