import { create } from 'zustand';
import type { SearchType, SourceType, SearchState, SearchActions, SearchStore } from '@/app/types';

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

export const useSearchStore = create<SearchStore>((set, get) => {
  const saveToLocalStorage = (state: SearchState) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'search-store',
        JSON.stringify({
          query: state.query,
          searchType: state.searchType,
          sourceType: state.sourceType,
          results: state.results,
          allResults: state.allResults,
          totalCount: state.totalCount,
          currentPage: state.currentPage,
        })
      );
    }
  };

  const setState = (updates: Partial<SearchState>) => {
    set(updates);
    set((state) => {
      saveToLocalStorage(state);
      return state;
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
        const updated = { allResults: [...state.allResults, ...newResults] };
        saveToLocalStorage({ ...state, ...updated });
        return updated;
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
          set({
            query: parsed.query || initialState.query,
            searchType: parsed.searchType || initialState.searchType,
            sourceType: parsed.sourceType || initialState.sourceType,
            results: parsed.results || initialState.results,
            allResults: parsed.allResults || initialState.allResults,
            totalCount: parsed.totalCount || initialState.totalCount,
            currentPage: parsed.currentPage || initialState.currentPage,
          });
        }
      } catch (error) {
        console.error('Failed to hydrate search state:', error);
      }
    },
  };
});
