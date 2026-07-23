import { SEARCH_CONFIG } from '@/app/constants/config';
import type { User, SearchResponse, RepositoryDetail, UserDetail, WeeklyCommits } from '@/app/types';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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
        data.items.map(async (user) => {
          try {
            const userItem = user as User;
            const userResponse = await fetch(
              `${SEARCH_CONFIG.GITHUB_API_BASE}/users/${userItem.login}`,
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
                ...(user as User),
                public_repos: fullUser.public_repos,
                followers: fullUser.followers,
                bio: fullUser.bio,
                location: fullUser.location,
              };
            }
          } catch (error) {
            console.error(`Failed to fetch user details for ${(user as User).login}:`, error);
          }
          return user;
        })
      );
      return { ...data, items: enrichedItems.map((item) => ({ ...item, source: 'github' as const })) };
    }

    // GitLab-адаптер проставляє source явно, GitHub досі покладався на дефолти
    // в картках. Через це ключ дедуплікації виходив "undefined-<id>" —
    // працювало, але тільки випадково.
    return { ...data, items: data.items.map((item) => ({ ...item, source: 'github' as const })) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`GitHub API search error (${type}):`, errorMessage);
    throw error;
  }
}

export async function getRepositoryDetail(owner: string, repo: string): Promise<RepositoryDetail> {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is not configured');
  }

  const repoUrl = `${SEARCH_CONFIG.GITHUB_API_BASE}/repos/${owner}/${repo}`;
  const languagesUrl = `${repoUrl}/languages`;
  const statsUrl = `${repoUrl}/stats/commit_activity`;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    // Fetch основні дані репозиторію
    const repoRes = await fetch(repoUrl, { method: 'GET', headers });
    if (!repoRes.ok) {
      throw new Error(`GitHub API error: ${repoRes.status} ${repoRes.statusText}`);
    }
    const repoData = await repoRes.json();

    // Fetch мови програмування
    const langRes = await fetch(languagesUrl, { method: 'GET', headers });
    const languages = langRes.ok ? await langRes.json() : {};

    // Fetch commit activity. Увага: 202 ("GitHub ще рахує статистику") і 204
    // (порожній репозиторій) теж дають statsRes.ok === true, але тіло при цьому
    // не масив — або {}, або взагалі порожнє. Тому мало перевірити .ok.
    const statsRes = await fetch(statsUrl, { method: 'GET', headers });
    let commitActivity: WeeklyCommits[] = [];
    if (statsRes.ok && statsRes.status !== 202 && statsRes.status !== 204) {
      const statsText = await statsRes.text();
      const statsData = statsText ? JSON.parse(statsText) : null;
      if (Array.isArray(statsData)) {
        commitActivity = statsData.map((stat: any) => ({
          week: stat.week,
          commits: stat.total,
        }));
      }
    }
    // 202/204/помилка — лишаємо commitActivity пустим (UI покаже "Computing…")

    return {
      id: repoData.id,
      name: repoData.name,
      owner: {
        login: repoData.owner.login,
        avatar_url: repoData.owner.avatar_url,
      },
      description: repoData.description,
      html_url: repoData.html_url,
      stargazers_count: repoData.stargazers_count,
      forks_count: repoData.forks_count,
      open_issues_count: repoData.open_issues_count,
      watchers_count: repoData.watchers_count,
      language: repoData.language,
      created_at: repoData.created_at,
      pushed_at: repoData.pushed_at,
      homepage: repoData.homepage,
      topics: repoData.topics || [],
      license: repoData.license,
      languages,
      commitActivity,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`GitHub API repo detail error (${owner}/${repo}):`, errorMessage);
    throw error;
  }
}

export async function getUserDetail(login: string): Promise<UserDetail> {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is not configured');
  }

  const userUrl = `${SEARCH_CONFIG.GITHUB_API_BASE}/users/${login}`;
  const reposUrl = `${userUrl}/repos?sort=stars&per_page=30`;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    // Fetch юзер
    const userRes = await fetch(userUrl, { method: 'GET', headers });
    if (!userRes.ok) {
      throw new Error(`GitHub API error: ${userRes.status} ${userRes.statusText}`);
    }
    const userData = await userRes.json();

    // Fetch репозиторії (для top repos + language stats)
    const reposRes = await fetch(reposUrl, { method: 'GET', headers });
    let repos = [];
    if (reposRes.ok) {
      repos = await reposRes.json();
    }

    // Top repos by stars
    const topRepositories = repos
      .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
      .slice(0, 10)
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        stargazers_count: r.stargazers_count,
        url: r.html_url,
      }));

    // Language stats
    const langMap = new Map<string, { repos: number; bytes: number }>();
    repos.forEach((r: any) => {
      if (r.language) {
        const stat = langMap.get(r.language) || { repos: 0, bytes: 0 };
        stat.repos += 1;
        stat.bytes += r.size || 0;
        langMap.set(r.language, stat);
      }
    });
    const languageStats = Array.from(langMap.entries()).map(([lang, stat]) => ({
      language: lang,
      repos: stat.repos,
      bytes: stat.bytes,
    }));

    return {
      id: userData.id,
      login: userData.login,
      avatar_url: userData.avatar_url,
      name: userData.name,
      bio: userData.bio,
      location: userData.location,
      blog: userData.blog,
      company: userData.company,
      followers: userData.followers,
      following: userData.following,
      // /users/:login віддає повний лічильник; repos.length зрізаний per_page=30
      // і бреше для активних акаунтів (makenotion: 55 реальних проти 30).
      public_repos: userData.public_repos ?? repos.length,
      created_at: userData.created_at,
      html_url: userData.html_url,
      topRepositories,
      languageStats,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`GitHub API user detail error (${login}):`, errorMessage);
    throw error;
  }
}
