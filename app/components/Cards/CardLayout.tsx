'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { getSourceLabel } from '@/app/constants/sourceLabels';
import type { SourceType } from '@/app/types';

interface CardLayoutProps {
  detailUrl?: string; // внутрішня URL для detail-сторінки
  externalUrl?: string; // зовнішня URL до github.com/gitlab.com (legacy, може бути пусто)
  url?: string; // legacy: якщо externalUrl не задана, використовується це
  source?: SourceType;
  avatar?: ReactNode;
  header: ReactNode;
  content?: ReactNode;
  footer: ReactNode;
  favoriteButton: ReactNode;
  variant?: 'list' | 'grid';
  badgePosition?: 'top-left' | 'top-center';
}

export function CardLayout({
  detailUrl,
  externalUrl,
  url,
  source = 'github',
  avatar,
  header,
  content,
  footer,
  favoriteButton,
  variant = 'list',
  badgePosition = 'top-left',
}: CardLayoutProps) {
  const isCentered = variant === 'grid';
  const badgeClasses =
    badgePosition === 'top-center'
      ? 'absolute top-4 left-1/2 -translate-x-1/2'
      : 'absolute top-4 left-4';

  // Картку рендерять лише дві сторінки (/ і /favorites) — див. useBackNavigation.
  // Джерело дописуємо самі, а не вгадуємо його на detail-сторінці заднім числом.
  const pathname = usePathname();
  const from = pathname.startsWith('/favorites') ? 'favorites' : 'search';

  // Вибери, яку URL використовувати для внутрішньої навігації
  const internalUrl = detailUrl || url;
  // Зовнішня URL (за вмовчанням — url, якщо externalUrl не задана)
  const externUrl = externalUrl || url;

  // Якщо є внутрішня URL, використовуємо Link. Інакше — legacy поведінка (зовнішня ланка)
  const contentElement = (
    <>
      {avatar && (
        <div className={isCentered ? 'flex justify-center mb-3' : ''}>
          {avatar}
        </div>
      )}

      <div className={isCentered ? '' : 'flex items-start gap-3 mb-3'}>
        {header}
      </div>

      {content}

      {footer}
    </>
  );

  return (
    <div
      className={`relative border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all duration-200 ${
        isCentered ? 'p-6 text-center' : 'p-4'
      }`}
    >
      <div className={`${badgeClasses} text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded`}>
        {getSourceLabel(source)}
      </div>

      {internalUrl && internalUrl.startsWith('/') ? (
        // Внутрішня ланка (Next.js Link)
        <Link href={`${internalUrl}?from=${from}`} className="block">
          {contentElement}
        </Link>
      ) : (
        // Зовнішня ланка (legacy)
        <a href={externUrl} target="_blank" rel="noopener noreferrer" className="block">
          {contentElement}
        </a>
      )}

      <div
        className={`absolute ${isCentered ? 'top-6 right-6' : 'top-4 right-4'}`}
        onClick={(e) => e.preventDefault()} // Запобігаємо обраті при кліку на favorite
      >
        {favoriteButton}
      </div>
    </div>
  );
}
