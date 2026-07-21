'use client';

import { SearchBar, TypeSelector, SourceSelector } from '../Search';

export function SearchSection() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="flex-1 w-full">
          <SearchBar />
        </div>
        <div className="w-full md:w-auto">
          <SourceSelector />
        </div>
        <div className="w-full md:w-auto">
          <TypeSelector />
        </div>
      </div>
    </div>
  );
}
