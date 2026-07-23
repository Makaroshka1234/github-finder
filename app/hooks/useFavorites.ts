'use client';

import { useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFavorite,
  deleteFavorite,
  getFavorites,
  queryKeys,
  type CreateFavoritePayload,
} from '@/app/lib/api';
import type { Favorite } from '@/app/types';

/** Ключ прив'язаний до акаунта — див. коментар біля queryKeys.favorites */
function useFavoritesKey() {
  const { data: session } = useSession();
  return queryKeys.favorites(session?.user?.email ?? 'anonymous');
}

export function useFavorites() {
  const { status } = useSession();
  const queryKey = useFavoritesKey();

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: getFavorites,
    enabled: status === 'authenticated',
  });

  // useMemo, а не `data ?? []`: інакше кожен рендер дає новий масив
  // і мемоїзація isFavorited нижче стає марною
  const favorites = useMemo(() => data ?? [], [data]);

  const isFavorited = useCallback(
    (source: string, itemType: string, externalId: string) =>
      favorites.some(
        (f) => f.source === source && f.itemType === itemType && f.externalId === externalId
      ),
    [favorites]
  );

  return { favorites, isLoading, isFavorited };
}

/**
 * Спільний оптимістичний цикл для обох мутацій.
 * cancelQueries обов'язковий: інакше фоновий рефетч, що вже летить,
 * приземлиться після setQueryData і затре оптимістичний стан.
 */
function useOptimisticFavoriteMutation<TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  applyOptimistic: (current: Favorite[], vars: TVars) => Favorite[]
) {
  const queryClient = useQueryClient();
  const queryKey = useFavoritesKey();

  return useMutation({
    mutationFn,
    onMutate: async (vars: TVars) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Favorite[]>(queryKey) ?? [];
      queryClient.setQueryData<Favorite[]>(queryKey, applyOptimistic(previous, vars));
      return { previous };
    },
    onError: (error, _vars, context) => {
      console.error('Favorite mutation failed:', error);
      queryClient.setQueryData<Favorite[]>(queryKey, context?.previous);
    },
    // Рефетч підтягне справжній запис із сервера — ручний temp→real свап не потрібен.
    // Redis-кеш роута мутація вже інвалідувала, тож прийдуть свіжі дані з БД.
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useAddFavorite() {
  return useOptimisticFavoriteMutation<CreateFavoritePayload>(
    createFavorite,
    (current, vars) => [
      {
        // Тимчасовий запис: onSettled замінить його справжнім із сервера
        id: `optimistic-${vars.source}-${vars.itemType}-${vars.externalId}`,
        userId: '',
        source: vars.source,
        itemType: vars.itemType,
        externalId: vars.externalId,
        snapshotData: vars.snapshotData,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      ...current,
    ]
  );
}

export function useRemoveFavorite() {
  return useOptimisticFavoriteMutation<string>(deleteFavorite, (current, id) =>
    current.filter((f) => f.id !== id)
  );
}
