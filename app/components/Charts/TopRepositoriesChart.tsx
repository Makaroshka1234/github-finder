'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TopRepository } from '@/app/types';

interface Props {
  repos: TopRepository[];
}

export default function TopRepositoriesChart({ repos }: Props) {
  if (!repos || repos.length === 0) {
    return <div className="text-gray-600 text-center py-8">No repositories</div>;
  }

  const data = repos.slice(0, 10).map((r) => ({
    name: r.name.length > 15 ? r.name.slice(0, 12) + '...' : r.name,
    stars: r.stargazers_count,
    fullName: r.name,
  }));

  return (
    // min-w-0 обов'язковий: інакше grid/flex-батько не дає ResponsiveContainer звузитись
    <div className="w-full min-w-0 h-65 sm:h-75">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 8, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={8} />
          <YAxis tick={{ fontSize: 11 }} width={40} />
          <Tooltip content={({ payload }: any) => {
            if (!payload || !payload[0]) return null;
            return (
              <div className="bg-white p-2 border border-gray-300 rounded text-sm">
                <p className="font-semibold">{payload[0].payload.fullName}</p>
                <p className="text-blue-600">{payload[0].value} stars</p>
              </div>
            );
          }} />
          <Bar dataKey="stars" fill="#3b82f6" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
