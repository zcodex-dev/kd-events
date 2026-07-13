import { NextResponse } from 'next/server';
import { getFileById, updateFileRecord, removeFile } from '@/lib/uploads/metadata';
import { deleteFile as r2Delete } from '@/lib/r2/client';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse, UploadedFile } from '@/types';

type RouteParams = { params: Promise<{ id: string }> };

// ── GET: Retrieve a single file by ID ──────────────────────────────────────

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const file = await getFileById(id);

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<UploadedFile>>(
      { success: true, data: file },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get file error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to retrieve file' },
      { status: 500 }
    );
  }
}

// ── PATCH: Update file metadata (e.g., rename) ────────────────────────────

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session || !session.permissions.canReplace) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized. Modify permission required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Only allow safe fields to be updated
    const allowedUpdates: Partial<UploadedFile> = {};
    if (body.originalName && typeof body.originalName === 'string') {
      allowedUpdates.originalName = body.originalName.slice(0, 200);
    }

    const updated = await updateFileRecord(id, allowedUpdates);

    if (!updated) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<UploadedFile>>(
      { success: true, data: updated, message: 'File updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update file error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update file' },
      { status: 500 }
    );
  }
}

// ── DELETE: Remove file from R2 and metadata ───────────────────────────

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session || !session.permissions.canDelete) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized. Delete permission required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const file = await getFileById(id);

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete file from Cloudflare R2
    try {
      await r2Delete(file.githubPath); // githubPath stores the R2 key
    } catch (error) {
      console.warn('File not found on R2 or delete failed, removing metadata anyway:', error);
    }

    // Remove from metadata index
    await removeFile(id);

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'File deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
