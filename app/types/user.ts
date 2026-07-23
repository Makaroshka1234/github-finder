export interface User {
  id: number;
  login: string;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  /** Може бути відсутнім: старі записи в улюблених збережені без цього поля */
  public_repos?: number;
  followers: number;
  html_url: string;
  source?: 'github' | 'gitlab';
}
