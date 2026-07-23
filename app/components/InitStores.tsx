'use client';

import { useEffect } from 'react';
import { useSearchStore } from '@/app/store/searchStore';

/**
 * Гідрація zustand-сторів після монтування на клієнті.
 * Улюблені тут більше не вантажаться — ними займається useFavorites (TanStack).
 */
export function InitStores() {
  const { _hydrate } = useSearchStore();

  useEffect(() => {
    _hydrate?.();
  }, [_hydrate]);

  return null;
}
