import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, SubUser } from '@/types';

function mapAdminUserToSubUser(user: any): SubUser {
  const isSuper = user.role.toUpperCase() === 'SUPERADMIN';
  return {
    id: user.id,
    username: user.personnelId, // Map personnelId to username for frontend compatibility
    password: user.password,
    role: isSuper ? 'admin' : 'user',
    permissions: {
      canUpload: true, // Everyone can upload
      canDelete: isSuper,
      canReplace: isSuper,
    },
    createdAt: user.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const adminUsers = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const users: SubUser[] = adminUsers.map(mapAdminUserToSubUser);

    return NextResponse.json<ApiResponse<SubUser[]>>(
      { success: true, data: users },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !username.trim() || !password || !password.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Personnel ID and password are required' },
        { status: 400 }
      );
    }

    const personnelId = username.trim().toUpperCase();

    if (personnelId === 'ADMIN') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot use reserved Personnel ID' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.adminUser.findUnique({
      where: { personnelId }
    });

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Personnel ID already exists' },
        { status: 400 }
      );
    }

    const newAdminUser = await prisma.adminUser.create({
      data: {
        personnelId,
        password: password.trim(),
        role: role === 'admin' ? 'SUPERADMIN' : 'ADMIN',
        name: personnelId,
      }
    });

    const mappedUser = mapAdminUserToSubUser(newAdminUser);

    return NextResponse.json<ApiResponse<SubUser>>(
      { success: true, data: mappedUser, message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
