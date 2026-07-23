'use client';

import { useBackNavigation } from '@/app/hooks/useBackNavigation';
import { StatsGrid } from '@/app/components/Stats';
import { DetailBackLink } from './DetailBackLink';
import { DetailHeader } from './DetailHeader';
import { DetailActions } from './DetailActions';
import { DetailCharts } from './DetailCharts';
import { DetailInfoPanel } from './DetailInfoPanel';
import { present, type DetailConfig } from './types';

export function DetailLayout({
  avatarUrl,
  avatarAlt,
  title,
  subtitle,
  description,
  actions,
  stats,
  charts,
  info,
}: DetailConfig) {
  const backNav = useBackNavigation();
  const visibleActions = present(actions);
  const visibleCharts = present(charts);
  // Рядок без значення ховаємо цілком (як StatsGrid): API не завжди віддає поле
  const visibleInfo = present(info).filter((i) => i.value != null && i.value !== '');
  const hasBottom = visibleCharts.length > 0 || visibleInfo.length > 0;

  return (
    <div className="max-w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <DetailBackLink {...backNav} />
        <DetailHeader
          avatarUrl={avatarUrl}
          avatarAlt={avatarAlt}
          title={title}
          subtitle={subtitle}
          description={description}
        />
        <DetailActions actions={visibleActions} />
      </div>

      {/* Stats */}
      <StatsGrid className="mb-6 sm:mb-8" items={stats ?? []} />

      {/* Charts + Information: сайдбар відʼїжджає під графіки до xl.
          minmax(0,1fr) — щоб колонка з графіками могла звужуватись */}
      {hasBottom ?(
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 xl:gap-8">
          <DetailCharts charts={visibleCharts} />
          <DetailInfoPanel info={visibleInfo} />
        </div>
      ): <p>No info</p>}
    </div>
  );
}
