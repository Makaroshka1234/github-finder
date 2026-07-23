import type { ReactNode } from 'react';
import type { StatSlot } from '@/app/components/Stats';

export interface DetailAction {
  label: string;
  href: string;
  /** 'primary' — синя кнопка (за вмовчанням), 'secondary' — сіра */
  variant?: 'primary' | 'secondary';
}

export interface DetailChart {
  title: string;
  content: ReactNode;
}

export interface DetailInfoItem {
  label: string;
  value: ReactNode;
}

/** Falsy-значення дозволені, щоб писати `cond && { ... }` прямо в масиві.
    `''` теж потрібен: `str && {...}` при пустому рядку повертає '', а не false. */
export type Slot<T> = T | false | null | undefined | '';

export interface DetailConfig {
  avatarUrl?: string | null;
  avatarAlt: string;
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  actions?: readonly Slot<DetailAction>[];
  stats?: readonly StatSlot[];
  charts?: readonly Slot<DetailChart>[];
  info?: readonly Slot<DetailInfoItem>[];
}

export function present<T>(items: readonly Slot<T>[] | undefined): T[] {
  return (items ?? []).filter((item): item is T => Boolean(item));
}
