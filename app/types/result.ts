import type { Repository } from './repository';
import type { User } from './user';

export type SearchResult = Repository | User;

export function isRepository(item: SearchResult): item is Repository {
  return 'stargazers_count' in item && 'forks_count' in item;
}

export function isUser(item: SearchResult): item is User {
  return 'followers' in item && 'public_repos' in item;
}
