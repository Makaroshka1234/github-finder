import type { DetailChart } from './types';

interface DetailChartsProps {
  charts: readonly DetailChart[];
}

export function DetailCharts({ charts }: DetailChartsProps) {
  if (charts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
      {charts.map(({ title, content }) => (
        <div key={title} className="bg-white p-4 sm:p-6 rounded-lg shadow min-w-0">
          <h2 className="text-lg sm:text-xl font-bold mb-4">{title}</h2>
          {content}
        </div>
      ))}
    </div>
  );
}
