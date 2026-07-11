import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';
import type { ApiResponse } from '@/types';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
