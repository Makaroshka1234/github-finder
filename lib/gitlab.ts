import { SEARCH_CONFIG } from '@/app/constants/config';
import type { SearchResponse, RepositoryDetail, UserDetail, WeeklyCommits } from '@/app/types';

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

export async function getRepositoryDetail(projectId: string | number): Promise<RepositoryDetail> {
  if (!GITLAB_TOKEN) {
    throw new Error('GITLAB_TOKEN is not configured');
  }

  // GitLab вимагає URL-encoded шлях ("group/project" → "group%2Fproject").
  // Для числового ID encodeURIComponent — no-op, тож безпечно для обох форм.
  const projectUrl = `${GITLAB_API_BASE}/projects/${encodeURIComponent(String(projectId))}`;
  const languagesUrl = `${projectUrl}/languages`;
  const commitsUrl = `${projectUrl}/repository/commits?since=${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()}&per_page=100`;

  const headers = {
    'PRIVATE-TOKEN': GITLAB_TOKEN,
    'Content-Type': 'application/json',
  };

  try {
    // Fetch основні дані проекту
    const projectRes = await fetch(projectUrl, { method: 'GET', headers });
    if (!projectRes.ok) {
      throw new Error(`GitLab API error: ${projectRes.status} ${projectRes.statusText}`);
    }
    const projectData = await projectRes.json();

    // Fetch мови
    const langRes = await fetch(languagesUrl, { method: 'GET', headers });
    const languages = langRes.ok ? await langRes.json() : {};

    // Fetch commits за рік (best-effort, без гарантії повної історії)
    const commitsRes = await fetch(commitsUrl, { method: 'GET', headers });
    let commitActivity: WeeklyCommits[] = [];
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      // Bucket commits by week (best-effort, не точна 52-week статистика як у GitHub)
      const weekMap = new Map<number, number>();
      (Array.isArray(commits) ? commits : []).forEach((commit: any) => {
        const date = new Date(commit.created_at);
        const week = Math.floor(date.getTime() / 1000 / (7 * 24 * 60 * 60)) * (7 * 24 * 60 * 60);
        weekMap.set(week, (weekMap.get(week) || 0) + 1);
      });
      commitActivity = Array.from(weekMap.entries())
        .map(([week, count]) => ({ week, commits: count }))
        .sort((a, b) => a.week - b.week);
    }

    return {
      id: projectData.id,
      name: projectData.name,
      owner: {
        login: projectData.owner?.username || projectData.namespace?.name || 'unknown',
        avatar_url: projectData.owner?.avatar_url,
      },
      description: projectData.description,
      html_url: projectData.web_url,
      stargazers_count: projectData.star_count || 0,
      forks_count: projectData.forks_count || 0,
      open_issues_count: projectData.open_issues_count || 0,
      watchers_count: 0, // GitLab не має watchers як GitHub
      language: projectData.language,
      created_at: projectData.created_at,
      pushed_at: projectData.last_activity_at,
      homepage: projectData.web_url,
      topics: projectData.tag_list || [],
      license: projectData.license ? { name: projectData.license.name } : null,
      languages,
      commitActivity,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`GitLab API project detail error (${projectId}):`, errorMessage);
    throw error;
  }
}

export async function getUserDetail(username: string): Promise<UserDetail> {
  if (!GITLAB_TOKEN) {
    throw new Error('GITLAB_TOKEN is not configured');
  }

  const userUrl = `${GITLAB_API_BASE}/users?username=${encodeURIComponent(username)}`;

  const headers = {
    'PRIVATE-TOKEN': GITLAB_TOKEN,
    'Content-Type': 'application/json',
  };

  try {
    // Fetch юзер
    const userRes = await fetch(userUrl, { method: 'GET', headers });
    if (!userRes.ok) {
      throw new Error(`GitLab API error: ${userRes.status} ${userRes.statusText}`);
    }
    const users = await userRes.json();
    if (!users || users.length === 0) {
      throw new Error(`User not found: ${username}`);
    }
    const userData = users[0];

    // Fetch проекти. Два підводні камені GitLab API:
    //  1. GET /users/:id/projects приймає лише числовий ID (з username — 404),
    //     тому URL будуємо після отримання userData;
    //  2. sort приймає тільки asc/desc — "sort=stars" давав 400. Сортування
    //     за зірками робимо нижче в коді, серверне тут не потрібне.
    const projectsUrl = `${GITLAB_API_BASE}/users/${userData.id}/projects?per_page=30`;
    const projectsRes = await fetch(projectsUrl, { method: 'GET', headers });
    let projects = [];
    // GitLab не має лічильника проектів у профілі, зате віддає X-Total на
    // пагінованих списках — інакше projects.length зрізало б число до per_page.
    let projectsTotal: number | null = null;
    if (projectsRes.ok) {
      const data = await projectsRes.json();
      projects = Array.isArray(data) ? data : [];
      const total = Number(projectsRes.headers.get('x-total'));
      projectsTotal = Number.isFinite(total) ? total : null;
    } else {
      console.warn(
        `GitLab projects fetch failed for ${username} (id=${userData.id}): ${projectsRes.status}`
      );
    }

    // Top projects by stars
    const topRepositories = projects
      .filter((p: any) => !p.archived)
      .sort((a: any, b: any) => (b.star_count || 0) - (a.star_count || 0))
      .slice(0, 10)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        stargazers_count: p.star_count || 0,
        url: p.web_url,
      }));

    // Language stats
    const langMap = new Map<string, { repos: number; bytes: number }>();
    projects.forEach((p: any) => {
      if (p.language) {
        const stat = langMap.get(p.language) || { repos: 0, bytes: 0 };
        stat.repos += 1;
        stat.bytes += (p.size || 0) * 1024; // GitLab size у KB
        langMap.set(p.language, stat);
      }
    });
    const languageStats = Array.from(langMap.entries()).map(([lang, stat]) => ({
      language: lang,
      repos: stat.repos,
      bytes: stat.bytes,
    }));

    return {
      id: userData.id,
      login: userData.username,
      avatar_url: userData.avatar_url,
      name: userData.name,
      bio: userData.bio,
      location: userData.location,
      blog: userData.website_url,
      company: null, // GitLab не повертає company в API
      followers: 0, // GitLab не має followers API
      following: 0,
      public_repos: projectsTotal ?? projects.length,
      created_at: userData.created_at,
      html_url: userData.web_url,
      topRepositories,
      languageStats,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`GitLab API user detail error (${username}):`, errorMessage);
    throw error;
  }
}
