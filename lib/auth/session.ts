import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import type { SessionData } from '@/types';

// ─── Configuration ──────────────────────────────────────────────────────────

const SESSION_COOKIE_NAME = 'zfileup_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Session Encoding ───────────────────────────────────────────────────────

function encodeSession(data: SessionData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

function decodeSession(value: string): SessionData | null {
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf-8');
    return JSON.parse(decoded) as SessionData;
  } catch {
    return null;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Create a new authenticated session by setting an HTTP-only cookie.
 */
export async function createSession(
  username = 'admin',
  role: 'admin' | 'user' = 'admin',
  permissions = { canUpload: true, canDelete: true, canReplace: true }
): Promise<void> {
  const session: SessionData = {
    authenticated: true,
    username,
    role,
    permissions,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

/**
 * Get the current session if authenticated.
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!cookie) return null;

  const session = decodeSession(cookie.value);
  if (!session) return null;

  if (!session.authenticated) return null;
  if (session.expiresAt < Date.now()) return null;

  return session;
}

/**
 * Destroy the current session.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Validate the admin password against the environment variable.
 */
export function validatePassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is not set');
  }
  return password === adminPassword;
}

/**
 * Check if the current request has a valid session.
 * Use in server components and API routes.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!cookie) return false;

  const session = decodeSession(cookie.value);
  if (!session) return false;

  if (!session.authenticated) return false;
  if (session.expiresAt < Date.now()) return false;

  return true;
}

/**
 * Check authentication from a NextRequest (for middleware).
 */
export function isAuthenticatedFromRequest(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie) return false;

  const session = decodeSession(cookie.value);
  if (!session) return false;

  if (!session.authenticated) return false;
  if (session.expiresAt < Date.now()) return false;

  return true;
}

/**
 * Middleware helper: redirect unauthenticated users to login.
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  if (!isAuthenticatedFromRequest(request)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return null;
}
