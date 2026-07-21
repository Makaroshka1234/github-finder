'use client';

import type { Repository } from '@/app/types';
import { CardLayout } from './CardLayout';
import { FavoriteButton } from './FavoriteButton';

interface RepositoryCardProps {
  repository: Repository;
}

export function RepositoryCard({ repository }: RepositoryCardProps) {
  const { owner, name, description, language, stargazers_count, forks_count, html_url, source = 'github', id } = repository;

  return (
    <CardLayout
      url={html_url}
      source={source}
      avatar={
        owner.avatar_url && (
          <img
            src={owner.avatar_url}
            alt={owner.login}
            className="w-12 h-12 rounded-full shrink-0"
          />
        )
      }
      header={
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {name}
          </h3>
          <p className="text-sm text-gray-600">
            by {owner.login}
          </p>
        </div>
      }
      content={
        description && (
          <p className="text-sm text-gray-700 line-clamp-2 mb-4">
            {description}
          </p>
        )
      }
      footer={
        <div className="flex gap-4 text-sm text-gray-600">
          <span>⭐ {stargazers_count.toLocaleString()}</span>
          <span>🍴 {forks_count.toLocaleString()}</span>
          {language && <span>💾 {language}</span>}
        </div>
      }
      favoriteButton={
        <FavoriteButton
          source={source}
          itemType="repository"
          externalId={id.toString()}
          snapshotData={{
            name,
            owner: owner.login,
            description,
            url: html_url,
            stars: stargazers_count,
          }}
        />
      }
      variant="list"
      badgePosition="top-center"
    />
  );
}
