import { NextResponse } from 'next/server';
import { getPresignedUploadUrl, getPublicUrl } from '@/lib/r2/client';
import { getAppConfig } from '@/lib/uploads/metadata';
import {
  generateUniqueFileName,
  generateUploadPath,
  generateSlug,
  sanitizeFileName,
} from '@/lib/uploads/file-utils';
import { MAX_FILE_SIZE } from '@/lib/validation/schemas';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse } from '@/types';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.permissions.canUpload) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized. Upload permission required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { filename, mimeType, size } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File name is required' },
        { status: 400 }
      );
    }

    if (typeof size === 'number' && size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `File exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    const config = await getAppConfig();
    const cleanType = (mimeType || '').toLowerCase();
    
    // Check if type is allowed (or fallback extension check)
    const isAllowed = config.allowedTypes.some(
      (t) => t.toLowerCase() === cleanType || cleanType.startsWith(t.toLowerCase().replace('/*', ''))
    );

    if (cleanType && !isAllowed) {
      const allowedNames = config.allowedTypes
        .map((t) => t.split('/')[1]?.toUpperCase() || t)
        .join(', ');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Invalid file type. Allowed formats: ${allowedNames}`,
        },
        { status: 400 }
      );
    }

    const sanitized = sanitizeFileName(filename);
    const storedName = generateUniqueFileName(sanitized);
    const uploadFolder = process.env.R2_UPLOAD_FOLDER || 'public-uploads';
    const uploadPath = generateUploadPath(uploadFolder, storedName);
    const slug = generateSlug();
    const effectiveMimeType = cleanType || 'application/octet-stream';

    const uploadUrl = await getPresignedUploadUrl(uploadPath, effectiveMimeType);
    const publicUrl = getPublicUrl(uploadPath);

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        key: uploadPath,
        storedName,
        slug,
        publicUrl,
      },
    });
  } catch (error: any) {
    console.error('Presign API error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
