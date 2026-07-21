'use client';

import { ReactNode } from 'react';
import { getSourceLabel } from '@/app/constants/sourceLabels';
import type { SourceType } from '@/app/types';

interface CardLayoutProps {
  url: string;
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

  return (
    <div
      className={`relative border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all duration-200 ${
        isCentered ? 'p-6 text-center' : 'p-4'
      }`}
    >
      <div className={`${badgeClasses} text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded`}>
        {getSourceLabel(source)}
      </div>

      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
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
      </a>

      <div
        className={`absolute ${isCentered ? 'top-6 right-6' : 'top-4 right-4'}`}
      >
        {favoriteButton}
      </div>
    </div>
  );
}
