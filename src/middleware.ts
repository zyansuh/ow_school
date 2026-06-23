import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// Edge Runtime: auth.ts(Prisma) 대신 authConfig만 사용. OAuth/PKCE는 API 라우트에서 처리.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/admin/:path*'],
};
