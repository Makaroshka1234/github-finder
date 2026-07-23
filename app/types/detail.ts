// Repository detail page data

export interface RepositoryDetail {
  id: number;
  name: string;
  owner: {
    login: string;
    avatar_url?: string;
  };
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  language: string | null;
  created_at: string;
  pushed_at: string;
  homepage: string | null;
  topics: string[];
  license: { name: string } | null;
  // додаткові дані для графіків
  languages: Record<string, number>; // { "TypeScript": 45000, "JavaScript": 12000, ... }
  commitActivity: WeeklyCommits[];
}

export interface WeeklyCommits {
  week: number; // timestamp
  commits: number;
}

// User detail page data

export interface UserDetail {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  blog: string | null;
  company: string | null;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
  html_url: string;
  // дані для графіків
  topRepositories: TopRepository[];
  languageStats: LanguageStat[];
}

export interface TopRepository {
  id: number;
  name: string;
  stargazers_count: number;
  url: string;
}

export interface LanguageStat {
  language: string;
  repos: number; // скільки репо з цією мовою
  bytes: number; // загальна кількість байт
}
