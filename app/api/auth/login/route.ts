import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation/schemas';
import type { ApiResponse } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid credentials' },
        { status: 400 }
      );
    }

    const { personnelId, password } = parsed.data;

    // Default Super Admin fallback login check
    if (personnelId.toLowerCase() === 'admin') {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminPassword && password === adminPassword) {
        await createSession('admin', 'admin', { canUpload: true, canDelete: true, canReplace: true });
        return NextResponse.json<ApiResponse>(
          { success: true, message: 'Logged in successfully' },
          { status: 200 }
        );
      }
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { personnelId }
    });

    if (!adminUser || !adminUser.isActive || adminUser.password !== password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid Personnel ID or password' },
        { status: 401 }
      );
    }

    const role = adminUser.role.toUpperCase() === 'SUPERADMIN' ? 'admin' : 'user';

    await createSession(adminUser.personnelId, role as 'admin' | 'user', { canUpload: true, canDelete: true, canReplace: true });

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
