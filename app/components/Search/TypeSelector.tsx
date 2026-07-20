'use client';

import { useSearchStore } from '@/app/store/searchStore';
import { useStoreActions } from '@/app/hooks/useStoreActions';
import type { SearchType } from '@/app/types';

export function TypeSelector() {
  const searchType = useSearchStore((state) => state.searchType);
  const { setSearchType } = useStoreActions();

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as SearchType;
    setSearchType(newType);
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="type-select" className="text-sm font-medium text-gray-700">
        Search by
      </label>
      <select
        id="type-select"
        value={searchType}
        onChange={handleTypeChange}
        className="w-full md:w-48 border-2 border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 cursor-pointer focus:outline-none focus:border-blue-500 transition-colors duration-200"
      >
        <option value="user" className="text-gray-900">User</option>
        <option value="repo" className="text-gray-900">Repository</option>
      </select>
    </div>
  );
}
