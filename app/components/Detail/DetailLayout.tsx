'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { StatsGrid, type StatSlot } from '@/app/components/Stats';

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
type Slot<T> = T | false | null | undefined | '';

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
  /** Куди веде «← Back», за вмовчанням на головну */
  backHref?: string;
}

const ACTION_CLASSES = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
} as const;

function present<T>(items: readonly Slot<T>[] | undefined): T[] {
  return (items ?? []).filter((item): item is T => Boolean(item));
}

export function DetailLayout({
  avatarUrl,
  avatarAlt,
  title,
  subtitle,
  description,
  actions,
  stats,
  charts,
  info,
  backHref = '/',
}: DetailConfig) {
  const visibleActions = present(actions);
  const visibleCharts = present(charts);
  // Рядок без значення ховаємо цілком (як StatsGrid): API не завжди віддає поле
  const visibleInfo = present(info).filter((i) => i.value != null && i.value !== '');
  const hasBottom = visibleCharts.length > 0 || visibleInfo.length > 0;

  return (
    <div className="max-w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link href={backHref} className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to search
        </Link>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left mb-6">
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt={avatarAlt}
              width={128}
              height={128}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 wrap-break-word">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg sm:text-xl text-gray-600 wrap-break-word">{subtitle}</p>
            )}
            {description && (
              <p className="text-gray-600 mt-2 wrap-break-word">{description}</p>
            )}
          </div>
        </div>

        {visibleActions.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {visibleActions.map(({ label, href, variant = 'primary' }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2 rounded transition-colors ${ACTION_CLASSES[variant]}`}
              >
                {label}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <StatsGrid className="mb-6 sm:mb-8" items={stats ?? []} />

      {/* Charts + Information: сайдбар відʼїжджає під графіки до xl.
          minmax(0,1fr) — щоб колонка з графіками могла звужуватись */}
      {hasBottom && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 xl:gap-8">
          {visibleCharts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              {visibleCharts.map(({ title: chartTitle, content }) => (
                <div
                  key={chartTitle}
                  className="bg-white p-4 sm:p-6 rounded-lg shadow min-w-0"
                >
                  <h2 className="text-lg sm:text-xl font-bold mb-4">{chartTitle}</h2>
                  {content}
                </div>
              ))}
            </div>
          )}

          {visibleInfo.length > 0 && (
            <div className="bg-gray-50 p-4 sm:p-6 rounded h-fit">
              <h2 className="text-lg font-bold mb-4">Information</h2>
              <div className="grid grid-cols-2 xl:grid-cols-1 gap-4 text-sm">
                {visibleInfo.map(({ label, value }) => (
                  <div key={label} className="min-w-0">
                    <div className="text-gray-600">{label}</div>
                    <div className="font-semibold wrap-break-word">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
