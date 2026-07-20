import { create } from 'zustand';
import type { SearchType, SearchState, SearchActions, SearchStore } from '@/app/types';


const initialState: SearchState = {
  query: '',
  searchType: 'user',
  results: [],
  allResults: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
};

export const useSearchStore = create<SearchStore>((set) => ({
  ...initialState,
  setQuery: (query) => set({ query }),
  setSearchType: (searchType) =>
    set({
      searchType,
      results: [],
      allResults: [],
      totalCount: 0,
      error: null,
      currentPage: 1,
      isLoadingMore: false
    }),
  setResults: (results) => set({ results }),
  setAllResults: (allResults) => set({ allResults }),
  appendResults: (results) =>
    set((state) => {
      const existingIds = new Set(state.allResults.map((item) => item.id));
      const newResults = results.filter((item) => !existingIds.has(item.id));
      return { allResults: [...state.allResults, ...newResults] };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setIsLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
  setError: (error) => set({ error }),
  setTotalCount: (totalCount) => set({ totalCount }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  clear: () => set(initialState),
}));
