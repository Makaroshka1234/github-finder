'use client';

import type { Repository } from '@/app/types';

interface RepositoryCardProps {
  repository: Repository;
}

export function RepositoryCard({ repository }: RepositoryCardProps) {
  const { owner, name, description, language, stargazers_count, forks_count } = repository;

  return (
    <a
      href={repository.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all duration-200"
    >
      
      <div className="flex items-start gap-3 mb-3">
        <img
          src={owner.avatar_url}
          alt={owner.login}
          className="w-12 h-12 rounded-full shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {name}
          </h3>
          <p className="text-sm text-gray-600">
            by {owner.login}
          </p>
        </div>
      </div>

     
      {description && (
        <p className="text-sm text-gray-700 line-clamp-2 mb-4">
          {description}
        </p>
      )}

      
      <div className="flex gap-4 text-sm text-gray-600">
        <span>⭐ {stargazers_count.toLocaleString()}</span>
        <span>🍴 {forks_count.toLocaleString()}</span>
        {language && <span>💾 {language}</span>}
      </div>
    </a>
  );
}
