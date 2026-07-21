import type { SourceType } from '@/app/types';

export const SOURCE_LABELS: Record<SourceType | 'all', { emoji: string; name: string }> = {
  github: { emoji: '🐙', name: 'GitHub' },
  gitlab: { emoji: '🦊', name: 'GitLab' },
  all: { emoji: '⭐', name: 'All Sources' },
};

export function getSourceLabel(source: SourceType = 'github'): string {
  const label = SOURCE_LABELS[source];
  return `${label.emoji} ${label.name}`;
}
