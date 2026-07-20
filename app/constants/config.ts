// Search & API Configuration
export const SEARCH_CONFIG = {
  RESULTS_PER_PAGE: 9,
  DEBOUNCE_MS: 500,
  MIN_QUERY_LENGTH: 3,
  CACHE_TTL_SECONDS: 7200, // 2 hours
  GITHUB_API_BASE: 'https://api.github.com',
} as const;

export const LOADING_STATES = {
  SKELETON_COUNT: 3,
} as const;
