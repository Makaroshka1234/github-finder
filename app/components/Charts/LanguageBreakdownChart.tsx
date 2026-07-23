'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  languages: Record<string, number>;
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export default function LanguageBreakdownChart({ languages }: Props) {
  const data = Object.entries(languages)
    .map(([name, bytes]) => ({ name, value: bytes }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // top 8 мов

  if (data.length === 0) {
    return <div className="text-gray-600 text-center py-8">No language data available</div>;
  }

  return (
    // min-w-0 обов'язковий: інакше grid/flex-батько не дає ResponsiveContainer звузитись
    <div className="w-full min-w-0 h-65 sm:h-75">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            outerRadius="70%"
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
