'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { getQueryClient } from '@/app/lib/queryClient';
import { InitStores } from '@/app/components/InitStores';

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <InitStores />
        {children}
      </SessionProvider>
      {/* Сам пакет віддає no-op у production-збірці, тож ручної умови не треба.
          Має бути всередині QueryClientProvider — бере клієнт з контексту. */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}
