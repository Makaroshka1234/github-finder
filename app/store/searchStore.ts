import { create } from 'zustand';
import type { SearchState, SearchStore } from '@/app/types';

const initialState: SearchState = {
  query: '',
  searchType: 'user',
  sourceType: 'all',
};

export const useSearchStore = create<SearchStore>((set) => {
  const saveToLocalStorage = (state: SearchState) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        'search-store',
        JSON.stringify({
          query: state.query,
          searchType: state.searchType,
          sourceType: state.sourceType,
        })
      );
    } catch (error) {
      console.error('Failed to persist search state (storage quota?):', error);
    }
  };

  const setState = (updates: Partial<SearchState>) => {
    set((state) => {
      const next = { ...state, ...updates };
      saveToLocalStorage(next);
      return next;
    });
  };

  return {
    ...initialState,
    setQuery: (query) => setState({ query }),
    // Скидати результати вручну більше не треба: інший тип/джерело —
    // це інший queryKey, тож TanStack сам віддасть свій набір даних
    setSearchType: (searchType) => setState({ searchType }),
    setSourceType: (sourceType) => setState({ sourceType }),
    clear: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('search-store');
      }
      setState(initialState);
    },
    // Гідрація: підтягуємо збережені параметри після того, як клієнт готовий.
    // Результати не відновлюємо — зміна query запустить запит, а лоадер веде TanStack.
    _hydrate: () => {
      if (typeof window === 'undefined') return;
      try {
        const saved = localStorage.getItem('search-store');
        if (!saved) return;
        const parsed = JSON.parse(saved);
        set({
          query: parsed.query || initialState.query,
          searchType: parsed.searchType || initialState.searchType,
          sourceType: parsed.sourceType || initialState.sourceType,
        });
      } catch (error) {
        console.error('Failed to hydrate search state:', error);
      }
    },
  };
});
