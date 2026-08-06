import { NextResponse } from 'next/server';
import { getPublicUrl } from '@/lib/r2/client';
import { addFile } from '@/lib/uploads/metadata';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse, UploadedFile, UploadResult, AdditionalImage } from '@/types';
import { nanoid } from 'nanoid';

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
    const {
      key,
      slug,
      storedName,
      originalName,
      mimeType,
      size,
      width,
      height,
      title,
      additionalImages: rawAdditionals,
    } = body;

    if (!key || !storedName || !originalName) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required file information' },
        { status: 400 }
      );
    }

    const now = new Date();
    const effectiveSlug = slug || nanoid(8);
    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'https://term.kompongdewa.win'
    ).replace(/\/$/, '');

    const shareUrl = `${appUrl}/view/${effectiveSlug}`;
    const primaryOriginalName = title && title.trim() ? title.trim() : originalName;

    // Process additional images if present
    const additionalImages: AdditionalImage[] = [];
    if (Array.isArray(rawAdditionals)) {
      for (const add of rawAdditionals) {
        if (add.key && add.storedName) {
          additionalImages.push({
            id: nanoid(12),
            originalName: add.originalName || add.storedName,
            storedName: add.storedName,
            githubPath: add.key,
            imageUrl: add.imageUrl || getPublicUrl(add.key),
            mimeType: add.mimeType || 'application/octet-stream',
            size: add.size || 0,
            width: add.width,
            height: add.height,
            uploadedAt: now.toISOString(),
          });
        }
      }
    }

    const totalSize = (size || 0) + additionalImages.reduce((acc, a) => acc + (a.size || 0), 0);

    const fileRecord: UploadedFile = {
      id: nanoid(16),
      slug: effectiveSlug,
      originalName: primaryOriginalName,
      storedName,
      githubPath: key,
      imageUrl: getPublicUrl(key),
      shareUrl,
      mimeType: mimeType || 'application/octet-stream',
      size: totalSize,
      width: width || undefined,
      height: height || undefined,
      uploadedAt: now.toISOString(),
      viewCount: 0,
      additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
    };

    await addFile(fileRecord);

    const result: UploadResult = {
      file: fileRecord,
      shareUrl,
      imageUrl: fileRecord.imageUrl,
    };

    return NextResponse.json<ApiResponse<UploadResult>>(
      {
        success: true,
        data: result,
        message: additionalImages.length > 0 ? 'Album uploaded successfully' : 'File uploaded successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Complete upload API error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to complete upload' },
      { status: 500 }
    );
  }
}
