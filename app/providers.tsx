'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { InitFavorites } from '@/app/components/InitFavorites';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <InitFavorites />
      {children}
    </SessionProvider>
  );
}
