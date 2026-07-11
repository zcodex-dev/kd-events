import { type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const redirect = requireAuth(request);
    if (redirect) return redirect;
  }

  // Protect admin API routes (except auth and view-count endpoints)
  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth/') &&
    !pathname.startsWith('/api/views/')
  ) {
    const redirect = requireAuth(request);
    if (redirect) return redirect;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/((?!auth|views).*)'],
};
