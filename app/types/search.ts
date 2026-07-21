import type { SearchResult } from './result';

export type SearchType = 'user' | 'repo';
export type SourceType = 'github' | 'gitlab' | 'all';

export interface SearchState {
  query: string;
  searchType: SearchType;
  sourceType: SourceType;
  results: SearchResult[];
  allResults: SearchResult[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
}

export interface SearchActions {
  setQuery: (query: string) => void;
  setSearchType: (type: SearchType) => void;
  setSourceType: (type: SourceType) => void;
  setResults: (results: SearchResult[]) => void;
  setAllResults: (results: SearchResult[]) => void;
  appendResults: (results: SearchResult[]) => void;
  setLoading: (isLoading: boolean) => void;
  setIsLoadingMore: (isLoadingMore: boolean) => void;
  setError: (error: string | null) => void;
  setTotalCount: (count: number) => void;
  setCurrentPage: (page: number) => void;
  clear: () => void;
  _hydrate?: () => void;
}

export type SearchStore = SearchState & SearchActions;

export interface SearchResponse {
  items: SearchResult[];
  total_count: number;
}
