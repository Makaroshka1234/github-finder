import { SEARCH_CONFIG } from '@/app/constants/config';
import type { User } from '@/app/types';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export interface SearchResponse {
  items: any[];
  total_count: number;
}

export async function searchGitHub(
  query: string,
  type: 'user' | 'repo',
  page: number = 1
): Promise<SearchResponse> {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is not configured');
  }

  const endpoint =
    type === 'repo'
      ? `${SEARCH_CONFIG.GITHUB_API_BASE}/search/repositories`
      : `${SEARCH_CONFIG.GITHUB_API_BASE}/search/users`;

  const sort = type === 'repo' ? 'stars' : 'followers';

  const url = new URL(endpoint);
  url.searchParams.set('q', query);
  url.searchParams.set('per_page', String(SEARCH_CONFIG.RESULTS_PER_PAGE));
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort', sort);
  url.searchParams.set('order', 'desc');
  if (type === 'user') {
    url.searchParams.set('state', 'open');
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded');
    }

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
    }

    const data: SearchResponse = await response.json();

    if (type === 'user' && data.items.length > 0) {
      const enrichedItems = await Promise.all(
        data.items.map(async (user: User) => {
          try {
            const userResponse = await fetch(
              `${SEARCH_CONFIG.GITHUB_API_BASE}/users/${user.login}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${GITHUB_TOKEN}`,
                  Accept: 'application/vnd.github.v3+json',
                },
              }
            );
            if (userResponse.ok) {
              const fullUser = await userResponse.json();
              return {
                ...user,
                public_repos: fullUser.public_repos,
                followers: fullUser.followers,
                bio: fullUser.bio,
                location: fullUser.location,
              };
            }
          } catch (error) {
            console.error(`Failed to fetch user details for ${user.login}:`, error);
          }
          return user;
        })
      );
      return { ...data, items: enrichedItems };
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`GitHub API search error (${type}):`, errorMessage);
    throw error;
  }
}
