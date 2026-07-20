'use client';

interface ResultsHeaderProps {
  totalCount: number;
}

export function ResultsHeader({ totalCount }: ResultsHeaderProps) {
  return (
    <div className="mb-6">
      <p className="text-gray-600">
        Found <span className="font-semibold">{totalCount.toLocaleString()}</span>{' '}
        result{totalCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
