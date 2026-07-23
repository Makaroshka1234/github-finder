'use client';

import type { RepositoryDetail } from '@/app/types';
import { DetailView } from '@/app/components/Detail';
import { repositoryDetailQuery } from '@/app/lib/api';
import { formatDate } from '@/app/lib/format';
import LanguageBreakdownChart from '@/app/components/Charts/LanguageBreakdownChart';
import CommitActivityChart from '@/app/components/Charts/CommitActivityChart';

interface Props {
  source: string;
  owner: string;
  name: string;
}

export default function RepositoryDetailView({ source, owner, name }: Props) {
  const sourceLabel = source === 'github' ? 'GitHub' : 'GitLab';

  return (
    <DetailView<RepositoryDetail>
      query={repositoryDetailQuery(source, owner, name)}
      config={(repo) => ({
        avatarUrl: repo.owner.avatar_url,
        avatarAlt: repo.owner.login,
        title: `${repo.owner.login}/${repo.name}`,
        description: repo.description,
        actions: [
          { label: `View on ${sourceLabel}`, href: repo.html_url },
          repo.homepage && {
            label: 'Homepage',
            href: repo.homepage,
            variant: 'secondary' as const,
          },
        ],
        stats: [
          { label: 'Stars', value: repo.stargazers_count },
          { label: 'Forks', value: repo.forks_count },
          { label: 'Open Issues', value: repo.open_issues_count },
          { label: 'Language', value: repo.language, size: 'md' },
        ],
        charts: [
          Object.keys(repo.languages).length > 0 && {
            title: 'Languages',
            content: <LanguageBreakdownChart languages={repo.languages} />,
          },
          {
            title: 'Commit Activity',
            content: (
              <CommitActivityChart
                commits={repo.commitActivity}
                isComputing={repo.commitActivity.length === 0 && source === 'github'}
              />
            ),
          },
        ],
        info: [
          { label: 'Created', value: formatDate(repo.created_at) },
          { label: 'Last Push', value: formatDate(repo.pushed_at) },
          repo.license && { label: 'License', value: repo.license.name },
          repo.topics.length > 0 && {
            label: 'Topics',
            value: (
              <div className="flex gap-2 flex-wrap">
                {repo.topics.map((t) => (
                  <span key={t} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {t}
                  </span>
                ))}
              </div>
            ),
          },
        ],
      })}
    />
  );
}
