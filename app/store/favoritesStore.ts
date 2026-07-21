import { create } from 'zustand';

export interface Favorite {
  id: string;
  userId: string;
  source: 'github' | 'gitlab';
  itemType: 'repository' | 'user';
  externalId: string;
  snapshotData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface FavoritesState {
  favorites: Favorite[];
  isLoaded: boolean;
  isFavorited: (source: string, itemType: string, externalId: string) => boolean;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (id: string) => void;
  setFavorites: (favorites: Favorite[]) => void;
  setLoaded: (loaded: boolean) => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoaded: false,

  isFavorited: (source, itemType, externalId) => {
    const { favorites } = get();
    return favorites.some(
      (f) =>
        f.source === source &&
        f.itemType === itemType &&
        f.externalId === externalId
    );
  },

  addFavorite: (favorite) => {
    set((state) => {
      const exists = state.favorites.some((f) => f.id === favorite.id);
      if (exists) return state;
      return { favorites: [favorite, ...state.favorites] };
    });
  },

  removeFavorite: (id) => {
    set((state) => ({
      favorites: state.favorites.filter((f) => f.id !== id),
    }));
  },

  setFavorites: (favorites) => {
    set({ favorites });
  },

  setLoaded: (loaded) => {
    set({ isLoaded: loaded });
  },
}));
