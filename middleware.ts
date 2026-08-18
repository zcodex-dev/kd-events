import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Only intercept requests to the root path
  if (pathname === '/') {
    // If accessing via register domain, show registration event page
    if (host.includes('register.kompongdewa.win')) {
      return NextResponse.rewrite(new URL('/event/registration', request.url));
    }
    
    // If accessing via enrollment domain, show enrollment page
    if (host.includes('enrollment.kompongdewa.win')) {
      return NextResponse.rewrite(new URL('/enrollment', request.url));
    }
    
    // Default fallback (e.g. main domain kompongdewa.win)
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
