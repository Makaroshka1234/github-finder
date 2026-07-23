import type { SearchResult } from './result';

export type SearchType = 'user' | 'repo';
export type SourceType = 'github' | 'gitlab' | 'all';

/** Тільки UI-стан. Результати, лоадери й помилки тримає TanStack Query
    (див. app/hooks/useSearch.ts) — дублювати серверний стан у zustand не треба. */
export interface SearchState {
  query: string;
  searchType: SearchType;
  sourceType: SourceType;
}

export interface SearchActions {
  setQuery: (query: string) => void;
  setSearchType: (type: SearchType) => void;
  setSourceType: (type: SourceType) => void;
  clear: () => void;
  _hydrate?: () => void;
}

export type SearchStore = SearchState & SearchActions;

export interface SearchResponse {
  items: SearchResult[];
  total_count: number;
}
