import { NextResponse } from 'next/server';
import { getAllFiles, getStats } from '@/lib/uploads/metadata';
import type { ApiResponse, UploadedFile, DashboardStats } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const type = searchParams.get('type') || '';
    const sort = searchParams.get('sort') || 'newest';
    const statsOnly = searchParams.get('stats') === 'true';

    // Return only stats if requested
    if (statsOnly) {
      const stats = await getStats();
      return NextResponse.json<ApiResponse<DashboardStats>>(
        { success: true, data: stats },
        { status: 200 }
      );
    }

    let files = await getAllFiles();

    // Filter by search query
    if (query) {
      files = files.filter(
        (f) =>
          f.originalName.toLowerCase().includes(query) ||
          f.storedName.toLowerCase().includes(query)
      );
    }

    // Filter by file type
    if (type) {
      files = files.filter((f) => f.mimeType.includes(type));
    }

    // Sort
    if (sort === 'oldest') {
      files.sort(
        (a, b) =>
          new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      );
    } else if (sort === 'largest') {
      files.sort((a, b) => b.size - a.size);
    } else if (sort === 'smallest') {
      files.sort((a, b) => a.size - b.size);
    } else if (sort === 'most-viewed') {
      files.sort((a, b) => b.viewCount - a.viewCount);
    }
    // Default 'newest' is already the order from metadata (unshift)

    return NextResponse.json<ApiResponse<UploadedFile[]>>(
      { success: true, data: files },
      { status: 200 }
    );
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to retrieve files' },
      { status: 500 }
    );
  }
}
