import { useSearchStore } from '@/app/store/searchStore';

export const useStoreActions = () => {
  const setQuery = useSearchStore((state) => state.setQuery);
  const setSearchType = useSearchStore((state) => state.setSearchType);
  const setSourceType = useSearchStore((state) => state.setSourceType);
  const clear = useSearchStore((state) => state.clear);

  return { setQuery, setSearchType, setSourceType, clear };
};
