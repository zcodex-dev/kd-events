import { NextResponse } from 'next/server';
import { createSession, validatePassword } from '@/lib/auth/session';
import { getUserByUsername } from '@/lib/uploads/metadata';
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

    const { username, password } = parsed.data;

    // Check if it is a sub-user login attempt
    if (username && username.trim().toLowerCase() !== 'admin') {
      const subUser = await getUserByUsername(username.trim());
      
      if (!subUser || subUser.password !== password) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      await createSession(subUser.username, subUser.role, subUser.permissions);

      return NextResponse.json<ApiResponse>(
        { success: true, message: 'Logged in successfully' },
        { status: 200 }
      );
    }

    // Default Super Admin login check
    const isValid = validatePassword(password);

    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    await createSession('admin', 'admin', { canUpload: true, canDelete: true, canReplace: true });

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
