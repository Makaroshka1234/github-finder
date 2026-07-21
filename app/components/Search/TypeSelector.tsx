'use client';

import { Select } from '@/app/components/UI';
import { useSearchStore } from '@/app/store/searchStore';
import { useStoreActions } from '@/app/hooks/useStoreActions';
import type { SearchType, SourceType } from '@/app/types';

function getSearchTypeOptions(sourceType: SourceType) {
  return [
    { value: 'user', label: 'User' },
    { value: 'repo', label: sourceType === 'gitlab' ? 'Project' : 'Repository' },
  ] as const;
}

export function TypeSelector() {
  const searchType = useSearchStore((state) => state.searchType);
  const sourceType = useSearchStore((state) => state.sourceType);
  const { setSearchType } = useStoreActions();

  return (
    <Select<SearchType>
      id="type-select"
      label="Search by"
      value={searchType}
      onChange={setSearchType}
      options={getSearchTypeOptions(sourceType)}
    />
  );
}
