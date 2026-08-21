import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostHeader = request.headers.get('host') || '';
  const forwardedHost = request.headers.get('x-forwarded-host') || '';
  const host = forwardedHost || hostHeader;
  const url = request.nextUrl.clone();
  
  console.log(`[PROXY] Request received - Host: "${host}", Path: "${pathname}"`);

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
    !pathname.startsWith('/api/config') &&
    pathname !== '/api/events'
  ) {
    const redirect = requireAuth(request);
    if (redirect) return redirect;
  }

  // 1. Handling for register.kompongdewa.win
  if (host.includes('register.kompongdewa.win') || host.includes('register')) {
    // Prevent access to /dashboard from the register domain
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/login')) {
      // Redirect them away to the root, which will serve the registration page
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    
    // Rewrite root to /event/registration so it serves it directly at the root URL
    if (pathname === '/') {
      url.pathname = '/event/registration';
      return NextResponse.rewrite(url);
    }
  } 
  // 2. Handling for enrollment.kompongdewa.win
  else if (host.includes('enrollment.kompongdewa.win') || host.includes('enrollment')) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/login')) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    
    if (pathname === '/') {
      url.pathname = '/enrollment';
      return NextResponse.rewrite(url);
    }
  }
  // 3. Handling for kompongdewa.win (and others like localhost)
  else {
    // Redirect root to /dashboard
    if (pathname === '/') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icon.png).*)',
  ],
};
