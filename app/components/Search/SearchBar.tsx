'use client';

import { useEffect } from 'react';
import { useSearchStore } from '@/app/store/searchStore';
import { useStoreActions } from '@/app/hooks/useStoreActions';
import { useSearch } from '@/app/hooks/useSearch';

export function SearchBar() {
  const query = useSearchStore((state) => state.query);
  const searchType = useSearchStore((state) => state.searchType);
  const { setQuery, clear } = useStoreActions();
  const { fetchResults } = useSearch();

  useEffect(() => {
    fetchResults(query, searchType);
  }, [query, searchType, fetchResults]);

  return (
    <div className="relative w-full">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
        🔍
      </span>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search GitHub..."
        className="w-full py-3 px-12 text-lg text-gray-900 border-2 border-gray-500 rounded-lg placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors duration-200"
      />

      {query && (
        <button
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          ✕
        </button>
      )}
    </div>
  );
}
