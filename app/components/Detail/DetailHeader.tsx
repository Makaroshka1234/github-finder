'use client';

import type { ReactNode } from 'react';
import { Avatar } from '@/app/components/UI';

interface DetailHeaderProps {
  avatarUrl?: string | null;
  avatarAlt: string;
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
}

export function DetailHeader({
  avatarUrl,
  avatarAlt,
  title,
  subtitle,
  description,
}: DetailHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left mb-6">
      <Avatar src={avatarUrl} alt={avatarAlt} size={128} className="w-24 h-24 sm:w-32 sm:h-32 shrink-0" />
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
  );
}
