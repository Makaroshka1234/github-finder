import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // GitHub аватарки
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      // GitLab аватарки (Gravatar + gitlab.com + CDN)
      { protocol: 'https', hostname: 'secure.gravatar.com' },
      { protocol: 'https', hostname: 'gitlab.com' },
      { protocol: 'https', hostname: 'assets.gitlab-static.net' },
    ],
  },
};

export default nextConfig;
