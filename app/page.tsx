"use client";

import { useSearchStore } from "./store/searchStore";
import { useSearch } from "./hooks/useSearch";
import { SearchSection, ResultsGrid } from "./components";
import { SEARCH_CONFIG } from "./constants/config";

export default function Home() {
  const query = useSearchStore((state) => state.query);
  const searchType = useSearchStore((state) => state.searchType);
  const {
    results,
    totalCount,
    isLoading,
    isFetchingNextPage,
    error,
    fetchNextPage,
    hasNextPage,
  } = useSearch();

  const isSearching = query.trim().length >= SEARCH_CONFIG.MIN_QUERY_LENGTH;

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
      <div
        className={
          isSearching
            ? "mb-8"
            : "flex items-center justify-center min-h-[60vh]"
        }
      >
        <div className={isSearching ? "" : "w-full max-w-2xl"}>
          <SearchSection />
        </div>
      </div>

      {isSearching && (
        <ResultsGrid
          results={results}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          error={error}
          searchType={searchType}
          query={query}
          totalCount={totalCount}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
        />
      )}
    </main>
  );
}
