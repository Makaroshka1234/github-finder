import { create } from 'zustand';
import type { SearchState, SearchStore } from '@/app/types';
import { SEARCH_CONFIG } from '@/app/constants/config';

const initialState: SearchState = {
  query: '',
  searchType: 'user',
  sourceType: 'all',
  results: [],
  allResults: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
};

const getResetResultsState = () => ({
  results: [],
  allResults: [],
  totalCount: 0,
  error: null,
  currentPage: 1,
  isLoadingMore: false,
});

export const useSearchStore = create<SearchStore>((set) => {
  const saveToLocalStorage = (state: SearchState) => {
    if (typeof window === 'undefined') return;
    try {
      // Персистимо лише параметри запиту — результати перефетчаться при поверненні
      localStorage.setItem(
        'search-store',
        JSON.stringify({
          query: state.query,
          searchType: state.searchType,
          sourceType: state.sourceType,
        })
      );
    } catch (error) {
      // QuotaExceededError за великого infinite-scroll — не валимо застосунок,
      // просто перестаємо персистити цей стан
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
    setSearchType: (searchType) =>
      setState({ searchType, ...getResetResultsState() }),
    setSourceType: (sourceType) =>
      setState({ sourceType, ...getResetResultsState() }),
    setResults: (results) => setState({ results }),
    setAllResults: (allResults) => setState({ allResults }),
    appendResults: (results) =>
      set((state) => {
        const existingKeys = new Set(state.allResults.map((item) => `${item.source}-${item.id}`));
        const newResults = results.filter((item) => !existingKeys.has(`${item.source}-${item.id}`));
        // allResults не персиститься — свіжі сторінки не пишемо в localStorage
        return { allResults: [...state.allResults, ...newResults] };
      }),
    setLoading: (isLoading) => setState({ isLoading }),
    setIsLoadingMore: (isLoadingMore) => setState({ isLoadingMore }),
    setError: (error) => setState({ error }),
    setTotalCount: (totalCount) => setState({ totalCount }),
    setCurrentPage: (currentPage) => setState({ currentPage }),
    clear: () => {
      // Очищуємо localStorage при clear
      if (typeof window !== 'undefined') {
        localStorage.removeItem('search-store');
      }
      setState(initialState);
    },
    // Гідрація: завантажуємо збережене після того як клієнт готов
    _hydrate: () => {
      if (typeof window === 'undefined') return;
      try {
        const saved = localStorage.getItem('search-store');
        if (saved) {
          const parsed = JSON.parse(saved);
          const query = parsed.query || initialState.query;
          set({
            query,
            searchType: parsed.searchType || initialState.searchType,
            sourceType: parsed.sourceType || initialState.sourceType,
            // Результати не відновлюємо — SearchBar автоматично перефетчить сторінку 1.
            // Одразу вмикаємо лоадер, щоб не блимнув порожній стан до завершення фетчу.
            isLoading: query.trim().length >= SEARCH_CONFIG.MIN_QUERY_LENGTH,
          });
        }
      } catch (error) {
        console.error('Failed to hydrate search state:', error);
      }
    },
  };
});
