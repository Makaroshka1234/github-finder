'use client';

import type { SearchResult } from '@/app/types';
import { isRepository } from '@/app/types';
import { RepositoryCard } from './RepositoryCard';
import { UserCard } from './UserCard';

interface ResultCardProps {
  item: SearchResult;
}

export function ResultCard({ item }: ResultCardProps) {
  if (isRepository(item)) {
    return <RepositoryCard repository={item} />;
  }
  return <UserCard user={item} />;
}
