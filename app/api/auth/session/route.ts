import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse, SessionData } from '@/types';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse<SessionData>>(
      { success: true, data: session },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Session API error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
