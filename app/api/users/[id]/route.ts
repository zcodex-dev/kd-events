import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, SubUser } from '@/types';

type RouteParams = { params: Promise<{ id: string }> };

function mapAdminUserToSubUser(user: any): SubUser {
  const isSuper = user.role.toUpperCase() === 'SUPERADMIN';
  return {
    id: user.id,
    username: user.personnelId,
    password: user.password,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    role: isSuper ? 'admin' : 'user',
    permissions: {
      canUpload: true,
      canDelete: isSuper,
      canReplace: isSuper,
    },
    createdAt: user.createdAt.toISOString(),
  };
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { username, password, role, nickname, avatarUrl } = body;

    const updates: any = {};

    if (nickname !== undefined) updates.nickname = nickname?.trim() || null;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl?.trim() || null;

    if (username && username.trim()) {
      const personnelId = username.trim().toUpperCase();
      if (personnelId === 'ADMIN') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Cannot use reserved Personnel ID' },
          { status: 400 }
        );
      }
      
      const existing = await prisma.adminUser.findUnique({
        where: { personnelId }
      });
      
      if (existing && existing.id !== id) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Personnel ID already exists' },
          { status: 400 }
        );
      }
      updates.personnelId = personnelId;
      updates.name = personnelId;
    }

    if (password && password.trim()) {
      updates.password = password.trim();
    }

    if (role) {
      updates.role = role === 'admin' ? 'SUPERADMIN' : 'ADMIN';
    }

    const updatedAdmin = await prisma.adminUser.update({
      where: { id },
      data: updates
    });

    return NextResponse.json<ApiResponse<SubUser>>(
      { success: true, data: mapAdminUserToSubUser(updatedAdmin), message: 'User updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    console.error('Update user error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    await prisma.adminUser.delete({
      where: { id }
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    console.error('Delete user error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
