import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  
  // 1. Handling for register.kompongdewa.win
  if (host.includes('register.kompongdewa.win') || host.includes('register')) {
    // Prevent access to /dashboard from the register domain
    if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/login')) {
      // Redirect them away to the root, which will serve the registration page
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    
    // Rewrite root to /event/registration so it serves it directly at the root URL
    if (url.pathname === '/') {
      url.pathname = '/event/registration';
      return NextResponse.rewrite(url);
    }
  } 
  // 2. Handling for kompongdewa.win (and others like localhost)
  else {
    // Redirect root to /dashboard
    if (url.pathname === '/') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    
    // Prevent access to /event from the admin domain
    if (url.pathname.startsWith('/event')) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Only run middleware on non-static/api routes to avoid performance overhead
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icon.png).*)',
  ],
};
