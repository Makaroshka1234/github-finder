'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useFavoritesStore, type Favorite } from '@/app/store/favoritesStore';

interface FavoriteButtonProps {
  source: 'github' | 'gitlab';
  itemType: 'repository' | 'user';
  externalId: string;
  snapshotData: Record<string, any>;
}

export function FavoriteButton({
  source,
  itemType,
  externalId,
  snapshotData,
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const { isFavorited, addFavorite, removeFavorite, favorites } = useFavoritesStore();
  const [isLoading, setIsLoading] = useState(false);

  const favoriteId = favorites.find(
    (f) => f.source === source && f.itemType === itemType && f.externalId === externalId
  )?.id;

  const isFav = isFavorited(source, itemType, externalId);

  const handleAdd = async () => {
    const tempId = crypto.randomUUID();
    const optimistic: Favorite = {
      id: tempId,
      userId: '',
      source,
      itemType,
      externalId,
      snapshotData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Optimistic add
    addFavorite(optimistic);

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, itemType, externalId, snapshotData }),
      });

      if (res.ok) {
        const data = await res.json();
        // Replace temp entry with real server record
        removeFavorite(tempId);
        addFavorite(data);
      } else {
        // Rollback on non-OK response
        removeFavorite(tempId);
      }
    } catch (error) {
      console.error('Failed to add favorite:', error);
      // Rollback on network error
      removeFavorite(tempId);
    }
  };

  const handleRemove = async (id: string) => {
    const previous = favorites.find((f) => f.id === id);

    // Optimistic remove
    removeFavorite(id);

    try {
      const res = await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
      if (!res.ok && previous) {
        // Rollback on non-OK response
        addFavorite(previous);
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      // Rollback on network error
      if (previous) {
        addFavorite(previous);
      }
    }
  };

  const handleToggle = async () => {
    if (!session) {
      alert('Будь ласка, авторизуйтесь');
      return;
    }

    setIsLoading(true);
    try {
      if (isFav && favoriteId) {
        await handleRemove(favoriteId);
      } else {
        await handleAdd();
      }
    } finally {
      setIsLoading(false);
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
