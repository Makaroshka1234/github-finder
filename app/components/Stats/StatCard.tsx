import { formatNumber } from "@/app/lib/format";
import { StatItem } from "./StatsGrid";


export function StatCard({ label, value, size = 'lg' }: StatItem) {
  return (
    <div className="bg-gray-50 p-4 rounded">
      <div className={`${size === 'lg' ? 'text-2xl' : 'text-lg'} font-bold text-gray-900`}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
