import { useSearchStore } from '@/app/store/searchStore';

export const useStoreActions = () => {
  const setQuery = useSearchStore((state) => state.setQuery);
  const setSearchType = useSearchStore((state) => state.setSearchType);
  const setResults = useSearchStore((state) => state.setResults);
  const setAllResults = useSearchStore((state) => state.setAllResults);
  const appendResults = useSearchStore((state) => state.appendResults);
  const setLoading = useSearchStore((state) => state.setLoading);
  const setIsLoadingMore = useSearchStore((state) => state.setIsLoadingMore);
  const setError = useSearchStore((state) => state.setError);
  const setTotalCount = useSearchStore((state) => state.setTotalCount);
  const setCurrentPage = useSearchStore((state) => state.setCurrentPage);
  const clear = useSearchStore((state) => state.clear);

  return {
    setQuery,
    setSearchType,
    setResults,
    setAllResults,
    appendResults,
    setLoading,
    setIsLoadingMore,
    setError,
    setTotalCount,
    setCurrentPage,
    clear,
  };
};
