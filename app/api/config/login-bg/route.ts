import { NextResponse } from 'next/server';
import { uploadFile, getPublicUrl } from '@/lib/r2/client';
import { getAppConfig, updateAppConfig } from '@/lib/uploads/metadata';
import { generateUploadPath, sanitizeFileName, generateUniqueFileName } from '@/lib/uploads/file-utils';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse } from '@/types';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized. Super admin required.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Process file
    const uploadFolder = process.env.GITHUB_UPLOAD_FOLDER || 'public-uploads';
    const now = new Date();
    const originalName = sanitizeFileName(file.name);
    const storedName = generateUniqueFileName(originalName);
    const r2Key = generateUploadPath(uploadFolder, storedName, now);

    const arrayBuffer = await file.arrayBuffer();
    await uploadFile(r2Key, Buffer.from(arrayBuffer), file.type);

    const imageUrl = getPublicUrl(r2Key);

    const currentConfig = await getAppConfig();
    await updateAppConfig({
      ...currentConfig,
      loginBgUrl: imageUrl,
    });

    return NextResponse.json<ApiResponse<{ url: string }>>(
      { success: true, data: { url: imageUrl }, message: 'Background updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login BG upload error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to upload background' },
      { status: 500 }
    );
  }
}
