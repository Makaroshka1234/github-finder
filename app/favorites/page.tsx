"use client";

import { useSession, signIn } from "next-auth/react";
import { useFavorites } from "@/app/hooks/useFavorites";
import { RepositoryCard } from "@/app/components/Cards/RepositoryCard";
import { UserCard } from "@/app/components/Cards/UserCard";
import { ItemGrid } from "@/app/components/Cards/ItemGrid";
import type {
  Repository,
  User,
  RepositorySnapshot,
  UserSnapshot,
} from "@/app/types";

export default function FavoritesPage() {
  const { status } = useSession();
  const { favorites, isLoading } = useFavorites();

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex-1 max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Мої улюблені</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-gray-700 mb-4">
            Авторизуйтесь щоб переглядати свої улюблені репозиторії та
            користувачів
          </p>
          <button
            onClick={() => signIn("github")}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Авторизуватися
          </button>
        </div>
      </div>
    );
  }

  const repositories = favorites
    .filter((f) => f.itemType === "repository")
    .map((f) => {
      const snap = f.snapshotData as RepositorySnapshot;
      return {
        id: parseInt(f.externalId) || 0,
        name: snap.name,
        owner: {
          login: snap.owner,
          avatar_url: "",
        },
        description: snap.description,
        html_url: snap.url,
        stargazers_count: snap.stars || 0,
        forks_count: 0,
        language: null,
        source: f.source,
      } as Repository;
    });

  const users = favorites
    .filter((f) => f.itemType === "user")
    .map((f) => {
      const snap = f.snapshotData as UserSnapshot;
      return {
        id: parseInt(f.externalId) || 0,
        login: snap.login,
        avatar_url: snap.avatar_url,
        bio: snap.bio,
        location: snap.location,
        public_repos: snap.public_repos,
        followers: snap.followers || 0,
        html_url: snap.url,
        source: f.source,
      } as User;
    });

  return (
    <div className="flex-1 max-w-full px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Мої улюблені ({favorites.length})
      </h1>

      {favorites.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            Ви ще не додали жодних улюблених. Пошукайте репозиторії та
            користувачів!
          </p>
        </div>
      ) : (
        <>
          <ItemGrid
            title="Репозиторії"
            items={repositories}
            renderItem={(repo) => <RepositoryCard key={repo.id} repository={repo} />}
          />
          <ItemGrid
            title="Користувачі"
            items={users}
            renderItem={(user) => <UserCard key={user.id} user={user} />}
          />
        </>
      )}
    </div>
  );
}
