'use client';

import type { User } from '@/app/types';
import { CardLayout } from './CardLayout';
import { FavoriteButton } from './FavoriteButton';

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const { avatar_url, login, bio, location, public_repos, followers, html_url, source = 'github', id } = user;

  return (
    <CardLayout
      url={html_url}
      source={source}
      avatar={
        avatar_url && (
          <img
            src={avatar_url}
            alt={login}
            className="w-16 h-16 rounded-full"
          />
        )
      }
      header={
        <h3 className="text-lg font-semibold text-gray-900">
          {login}
        </h3>
      }
      content={
        <>
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
        </>
      }
      footer={
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
      }
      favoriteButton={
        <FavoriteButton
          source={source}
          itemType="user"
          externalId={id.toString()}
          snapshotData={{
            login,
            avatar_url,
            bio,
            location,
            url: html_url,
            followers,
          }}
        />
      }
      variant="grid"
    />
  );
}
