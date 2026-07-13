import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getAllUsers, addUser } from '@/lib/uploads/metadata';
import type { ApiResponse, SubUser } from '@/types';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const users = await getAllUsers();
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
    const { username, password, role, permissions } = body;

    if (!username || !username.trim() || !password || !password.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const existingUsers = await getAllUsers();
    if (
      existingUsers.some((u) => u.username.toLowerCase() === username.trim().toLowerCase()) ||
      username.trim().toLowerCase() === 'admin'
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      );
    }

    const newUser: SubUser = {
      id: nanoid(10),
      username: username.trim(),
      password: password.trim(),
      role: role || 'user',
      permissions: {
        canUpload: permissions?.canUpload ?? true,
        canDelete: permissions?.canDelete ?? false,
        canReplace: permissions?.canReplace ?? false,
      },
      createdAt: new Date().toISOString(),
    };

    await addUser(newUser);

    return NextResponse.json<ApiResponse<SubUser>>(
      { success: true, data: newUser, message: 'User created successfully' },
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
