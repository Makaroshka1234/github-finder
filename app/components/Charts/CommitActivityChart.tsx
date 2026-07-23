'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WeeklyCommits } from '@/app/types';
import { formatShortDate } from '@/app/lib/format';

interface Props {
  commits: WeeklyCommits[];
  isComputing?: boolean;
}

export default function CommitActivityChart({ commits, isComputing }: Props) {
  if (isComputing) {
    return (
      <div className="text-gray-600 text-center py-8">
        Computing statistics… (GitHub computes stats asynchronously)
      </div>
    );
  }

  if (!commits || commits.length === 0) {
    return <div className="text-gray-600 text-center py-8">No commit data available</div>;
  }

  const data = commits
    .map((c) => ({
      week: formatShortDate(c.week * 1000),
      commits: c.commits,
    }))
    .slice(-52); // last 52 weeks

  return (
    // min-w-0 обов'язковий: інакше grid/flex-батько не дає ResponsiveContainer звузитись
    <div className="w-full min-w-0 h-65 sm:h-75">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 8, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            minTickGap={24}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11 }} width={40} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="commits"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
