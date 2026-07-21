import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const handler = NextAuth({
  ...authOptions,
  pages: {
    signIn: '/',
  },
  callbacks: {
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },
});

export const GET = handler;
export const POST = handler;
