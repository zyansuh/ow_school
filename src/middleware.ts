import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim(),
      secureCookie: process.env.NODE_ENV === 'production',
    });

    if (!token?.isAdmin) {
      const login = new URL('/login', request.url);
      login.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
