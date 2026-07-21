'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useFavoritesStore } from '@/app/store/favoritesStore';
import { useSearchStore } from '@/app/store/searchStore';

export function InitFavorites() {
  const { status } = useSession();
  const { setFavorites, setLoaded } = useFavoritesStore();
  const { _hydrate } = useSearchStore();

  useEffect(() => {
    // Гідруємо пошуковий стор із localStorage після монтажу клієнта
    _hydrate?.();
  }, [_hydrate]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Немає що завантажувати — очищуємо і позначаємо як завантажено
      setFavorites([]);
      setLoaded(true);
      return;
    }

    if (status !== 'authenticated') {
      // Ще завантажується сесія
      return;
    }

    const fetchFavorites = async () => {
      try {
        const res = await fetch('/api/favorites');
        if (res.ok) {
          const data = await res.json();
          setFavorites(data);
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      } finally {
        setLoaded(true);
      }
    };

    fetchFavorites();
  }, [status, setFavorites, setLoaded]);

  return null;
}
