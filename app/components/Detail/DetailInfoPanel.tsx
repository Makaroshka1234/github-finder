import type { DetailInfoItem } from './types';

interface DetailInfoPanelProps {
  info: readonly DetailInfoItem[];
}

export function DetailInfoPanel({ info }: DetailInfoPanelProps) {
  if (info.length === 0) return null;

  return (
    <div className="bg-gray-50 p-4 sm:p-6 rounded h-fit">
      <h2 className="text-lg font-bold mb-4">Information</h2>
      <div className="grid grid-cols-2 xl:grid-cols-1 gap-4 text-sm">
        {info.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <div className="text-gray-600">{label}</div>
            <div className="font-semibold wrap-break-word">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
