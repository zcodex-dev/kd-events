import { NextResponse } from 'next/server';
import { createSession, validatePassword } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validation/schemas';
import type { ApiResponse } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid credentials' },
        { status: 400 }
      );
    }

    const isValid = validatePassword(parsed.data.password);

    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    await createSession();

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Logged in successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
