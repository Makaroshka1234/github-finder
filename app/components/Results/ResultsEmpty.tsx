'use client';

import type { SearchType } from '@/app/types';

interface ResultsEmptyProps {
  searchType: SearchType;
}

export function ResultsEmpty({ searchType }: ResultsEmptyProps) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-700 mb-2">
        No {searchType === 'repo' ? 'repositories' : 'users'} found
      </h2>
      <p className="text-gray-500">Try a different search query</p>
    </div>
  );
}
