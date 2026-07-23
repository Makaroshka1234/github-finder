
export interface Favorite {
  id: string;
  userId: string;
  source: 'github' | 'gitlab';
  itemType: 'repository' | 'user';
  externalId: string;
  snapshotData: SnapshotData;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepositorySnapshot {
  name: string;
  owner: string;
  description: string | null;
  url: string;
  stars: number;
}

export interface UserSnapshot {
  login: string;
  avatar_url?: string;
  bio: string | null;
  location: string | null;
  url: string;
  followers: number;
  /** Опційне: знімки, збережені до появи цього поля, його не мають */
  public_repos?: number;
}

export type SnapshotData = RepositorySnapshot | UserSnapshot;
