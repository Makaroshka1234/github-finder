'use client';

import type { UserDetail } from '@/app/types';
import { DetailView } from '@/app/components/Detail';
import { userDetailQuery } from '@/app/lib/api';
import { formatDate } from '@/app/lib/format';
import TopRepositoriesChart from '@/app/components/Charts/TopRepositoriesChart';
import LanguageBreakdownChart from '@/app/components/Charts/LanguageBreakdownChart';

interface Props {
  source: string;
  login: string;
}

export default function UserDetailView({ source, login }: Props) {
  const sourceLabel = source === 'github' ? 'GitHub' : 'GitLab';

  return (
    <DetailView<UserDetail>
      query={userDetailQuery(source, login)}
      config={(user) => ({
        avatarUrl: user.avatar_url,
        avatarAlt: user.login,
        title: user.login,
        subtitle: user.name,
        description: user.bio,
        actions: [
          { label: `View on ${sourceLabel}`, href: user.html_url },
          user.blog && {
            label: 'Website',
            href: user.blog.startsWith('http') ? user.blog : `https://${user.blog}`,
            variant: 'secondary' as const,
          },
        ],
        stats: [
          { label: 'Repositories', value: user.public_repos },
          { label: 'Followers', value: user.followers },
          { label: 'Following', value: user.following },
          { label: 'Company', value: user.company, size: 'md' },
        ],
        charts: [
          user.topRepositories.length > 0 && {
            title: 'Top Repositories',
            content: <TopRepositoriesChart repos={user.topRepositories} />,
          },
          user.languageStats.length > 0 && {
            title: 'Languages',
            content: (
              <LanguageBreakdownChart
                languages={Object.fromEntries(
                  user.languageStats.map((l) => [l.language, l.bytes]),
                )}
              />
            ),
          },
        ],
        info: [
          { label: 'Member Since', value: formatDate(user.created_at) },
          user.location && { label: 'Location', value: user.location },
        ],
      })}
    />
  );
}
