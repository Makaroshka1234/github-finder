'use client';

import { useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useFavorites, useAddFavorite, useRemoveFavorite } from '@/app/hooks/useFavorites';
import type { SnapshotData } from '@/app/types';

interface FavoriteButtonProps {
  source: 'github' | 'gitlab';
  itemType: 'repository' | 'user';
  externalId: string;
  snapshotData: SnapshotData;
}

export function FavoriteButton({
  source,
  itemType,
  externalId,
  snapshotData,
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const { favorites, isFavorited } = useFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  // Синхронний замок: isPending оновлюється асинхронно й не встигає
  // застосуватись за швидкого дабл-кліку, а мутації самі не дедуплікуються
  const inFlightRef = useRef(false);

  const favoriteId = favorites.find(
    (f) => f.source === source && f.itemType === itemType && f.externalId === externalId
  )?.id;

  const isFav = isFavorited(source, itemType, externalId);
  const isLoading = addFavorite.isPending || removeFavorite.isPending;

  const handleToggle = async () => {
    if (!session) {
      // Неавторизований — ведемо на GitHub OAuth замість блокуючого alert
      signIn('github');
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      if (isFav && favoriteId) {
        await removeFavorite.mutateAsync(favoriteId);
      } else {
        await addFavorite.mutateAsync({ source, itemType, externalId, snapshotData });
      }
    } catch {
      // Відкат уже зробив onError мутації
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-2 rounded-lg transition-colors ${
        isFav
          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
      } disabled:opacity-50`}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    </button>
  );
}
