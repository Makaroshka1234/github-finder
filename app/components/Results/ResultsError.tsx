'use client';

interface ResultsErrorProps {
  error: string;
}

export function ResultsError({ error }: ResultsErrorProps) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-2">❌ Error</h2>
      <p className="text-gray-600">{error}</p>
    </div>
  );
}
