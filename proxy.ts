import { type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const redirect = requireAuth(request);
    if (redirect) return redirect;
  }

  // Protect admin API routes (except auth, view-count, raw image, register, and
  // the public events feed used by the visitor-facing registration page)
  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth/') &&
    !pathname.startsWith('/api/views/') &&
    !pathname.startsWith('/api/raw') &&
    !pathname.startsWith('/api/register') &&
    pathname !== '/api/events'
  ) {
    const redirect = requireAuth(request);
    if (redirect) return redirect;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/((?!auth|views|raw|register|events$).*)'],
};
