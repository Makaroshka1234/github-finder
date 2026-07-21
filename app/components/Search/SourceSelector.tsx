'use client';

import { Select } from '@/app/components/UI';
import { useSearchStore } from '@/app/store/searchStore';
import { useStoreActions } from '@/app/hooks/useStoreActions';
import type { SourceType } from '@/app/types';

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'github', label: 'GitHub' },
  { value: 'gitlab', label: 'GitLab' },
] as const;

export function SourceSelector() {
  const sourceType = useSearchStore((state) => state.sourceType);
  const { setSourceType } = useStoreActions();

  return (
    <Select<SourceType>
      id="source-select"
      label="Source"
      value={sourceType}
      onChange={setSourceType}
      options={SOURCE_OPTIONS}
    />
  );
}
