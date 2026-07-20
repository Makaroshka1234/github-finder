'use client';

import type { User } from '@/app/types';

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const { avatar_url, login, bio, location, public_repos, followers } = user;

  return (
    <a
      href={user.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-6 border border-gray-200 rounded-lg text-center hover:shadow-lg hover:border-blue-300 transition-all duration-200"
    >
      
      <img
        src={avatar_url}
        alt={login}
        className="w-16 h-16 rounded-full mx-auto mb-3"
      />

      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {login}
      </h3>

     
      {bio && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
          {bio}
        </p>
      )}

      
      {location && (
        <p className="text-sm text-gray-600 mb-3">
          📍 {location}
        </p>
      )}

      
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="flex justify-around">
          <div>
            <div className="font-semibold text-gray-900">
              {public_repos}
            </div>
            <div className="text-xs text-gray-500">Repositories</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {followers}
            </div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
        </div>
      </div>
    </a>
  );
}
