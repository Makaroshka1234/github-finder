import { SEARCH_CONFIG } from '@/app/constants/config';
import type { SearchResponse } from '@/app/types';

const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const GITLAB_API_BASE = process.env.GITLAB_API_BASE || SEARCH_CONFIG.GITLAB_API_BASE;

export async function searchGitLab(
  query: string,
  type: 'user' | 'repo',
  page: number = 1
): Promise<SearchResponse> {
  if (!GITLAB_TOKEN) {
    throw new Error('GITLAB_TOKEN is not configured');
  }

  const endpoint =
    type === 'repo'
      ? `${GITLAB_API_BASE}/projects`
      : `${GITLAB_API_BASE}/users`;

  const url = new URL(endpoint);
  url.searchParams.set('search', query);
  url.searchParams.set('per_page', String(SEARCH_CONFIG.RESULTS_PER_PAGE));
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort', 'desc');

  if (type === 'repo') {
    url.searchParams.set('visibility', 'public');
  } else {
    url.searchParams.set('order_by', 'updated_at');
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'PRIVATE-TOKEN': GITLAB_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 429) {
      throw new Error('GitLab API rate limit exceeded');
    }

    if (!response.ok) {
      throw new Error(
        `GitLab API error: ${response.status} ${response.statusText}`
      );
    }

    const items = await response.json();

    // Пагінація у GitLab — X-Total не завжди повертається при пошуку
    // Якщо total відсутній, то мінімум це кількість результатів на цій сторінці
    const totalCount = parseInt(response.headers.get('X-Total') || '0', 10) || items.length;

    // Нормалізація до стандартного формату
    const normalizedItems = items.map((item: any) => {
      if (type === 'repo') {
        return {
          id: item.id,
          name: item.name,
          owner: {
            login: item.owner?.username || item.path_with_namespace?.split('/')[0],
            avatar_url: item.owner?.avatar_url || undefined,
          },
          stargazers_count: item.star_count || 0,
          forks_count: item.forks_count || 0,
          language: item.language || null,
          description: item.description,
          html_url: item.web_url,
          source: 'gitlab',
        };
      } else {
        // user
        return {
          id: item.id,
          login: item.username,
          avatar_url: item.avatar_url,
          bio: item.bio || null,
          location: item.location || null,
          public_repos: item.projects_limit || 0,
          followers: 0, // GitLab не повертає followers в search результатах
          html_url: item.web_url,
          source: 'gitlab',
        };
      }
    });

    return {
      items: normalizedItems,
      total_count: totalCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`GitLab API search error (${type}):`, errorMessage);
    throw error;
  }
}
