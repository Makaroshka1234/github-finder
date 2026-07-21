'use client';

import type { ReactNode } from 'react';

interface ItemGridProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
}

export function ItemGrid<T>({ title, items, renderItem }: ItemGridProps<T>) {
  if (items.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {title} ({items.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(renderItem)}
      </div>
    </section>
  );
}
