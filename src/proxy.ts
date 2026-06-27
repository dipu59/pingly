import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next.js 16: middleware.ts is deprecated — use proxy.ts with export function proxy()
// Firebase Auth uses client-side tokens (IndexedDB), not HTTP cookies.
// True server-side auth guard requires Firebase Admin SDK with session cookies.
// For now, we handle auth redirects client-side via AuthGuard component.
// This proxy handles only the root "/" redirect.

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files, images, and API routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
