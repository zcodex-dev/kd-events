import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { updateUser, removeUser, getAllUsers } from '@/lib/uploads/metadata';
import type { ApiResponse, SubUser } from '@/types';

type RouteParams = { params: Promise<{ id: string }> };

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
    const { username, password, role, permissions } = body;

    const updates: Partial<SubUser> = {};

    if (username && username.trim()) {
      // Check if username collision with another user
      const users = await getAllUsers();
      if (
        users.some((u) => u.id !== id && u.username.toLowerCase() === username.trim().toLowerCase()) ||
        username.trim().toLowerCase() === 'admin'
      ) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Username already exists' },
          { status: 400 }
        );
      }
      updates.username = username.trim();
    }

    if (password && password.trim()) {
      updates.password = password.trim();
    }

    if (role) {
      updates.role = role;
    }

    if (permissions) {
      updates.permissions = {
        canUpload: permissions.canUpload ?? true,
        canDelete: permissions.canDelete ?? false,
        canReplace: permissions.canReplace ?? false,
      };
    }

    const updated = await updateUser(id, updates);
    if (!updated) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<SubUser>>(
      { success: true, data: updated, message: 'User updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
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
    const deleted = await removeUser(id);

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
