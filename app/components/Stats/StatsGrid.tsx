'use client';

import type { ReactNode } from 'react';
import { StatCard } from './StatCard';

export interface StatItem {
  label: string;
  value: ReactNode;
  /** 'lg' (за вмовчанням) — для чисел, 'md' — для довгого тексту (назва компанії, мова) */
  size?: 'md' | 'lg';
}

/** false/null/undefined дозволені, щоб можна було писати `cond && { ... }` прямо в масиві */
export type StatSlot = StatItem | false | null | undefined;

interface StatsGridProps {
  items: readonly StatSlot[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLUMN_CLASSES = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
} as const;



export function StatsGrid({ items, columns = 4, className }: StatsGridProps) {
  const visible = items.filter(
    (item): item is StatItem =>
      Boolean(item) && (item as StatItem).value != null && (item as StatItem).value !== ''
  );

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className={`grid ${COLUMN_CLASSES[columns]} gap-4 ${className ?? ''}`}>
      {visible.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}
