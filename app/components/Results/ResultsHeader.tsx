'use client';

import { formatNumber } from '@/app/lib/format';

interface ResultsHeaderProps {
  totalCount: number;
}

export function ResultsHeader({ totalCount }: ResultsHeaderProps) {
  return (
    <div className="mb-6">
      <p className="text-gray-600">
        Found <span className="font-semibold">{formatNumber(totalCount)}</span>{' '}
        result{totalCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
