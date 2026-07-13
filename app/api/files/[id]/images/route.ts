import { NextResponse } from 'next/server';
import { getFileById, updateFileRecord, getAppConfig } from '@/lib/uploads/metadata';
import { deleteFile as r2Delete, uploadFile, getPublicUrl } from '@/lib/r2/client';
import {
  sanitizeFileName,
  generateUniqueFileName,
  generateUploadPath,
} from '@/lib/uploads/file-utils';
import { validateFileSize, MAX_FILE_SIZE } from '@/lib/validation/schemas';
import type { ApiResponse, UploadedFile, AdditionalImage } from '@/types';
import { nanoid } from 'nanoid';

type RouteParams = { params: Promise<{ id: string }> };

// ── POST: Add an additional image to this file's page ──────────────────────────

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const fileRecord = await getFileById(id);

    if (!fileRecord) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File record not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const width = formData.get('width');
    const height = formData.get('height');

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // ── Validation ───────────────────────────────────────────────────────

    const config = await getAppConfig();

    if (!config.allowedTypes.includes(file.type)) {
      const allowedNames = config.allowedTypes
        .map((t) => t.split('/')[1]?.toUpperCase() || t)
        .join(', ');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Invalid file type. Allowed formats: ${allowedNames || 'None'}`,
        },
        { status: 400 }
      );
    }

    if (!validateFileSize(file.size, MAX_FILE_SIZE)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
        },
        { status: 400 }
      );
    }

    // ── Upload Object to R2 ──────────────────────────────────────────────

    const uploadFolder = process.env.GITHUB_UPLOAD_FOLDER || 'public-uploads';
    const originalName = sanitizeFileName(file.name);
    const storedName = generateUniqueFileName(originalName);
    const now = new Date();
    const r2Key = generateUploadPath(uploadFolder, storedName, now);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadFile(r2Key, buffer, file.type);

    // ── Update Metadata ──────────────────────────────────────────────────

    const newImage: AdditionalImage = {
      id: nanoid(12),
      originalName,
      storedName,
      githubPath: r2Key,
      imageUrl: getPublicUrl(r2Key),
      mimeType: file.type,
      size: file.size,
      width: width ? parseInt(width as string, 10) : undefined,
      height: height ? parseInt(height as string, 10) : undefined,
      uploadedAt: now.toISOString(),
    };

    const currentGallery = fileRecord.additionalImages || [];
    const updatedGallery = [...currentGallery, newImage];

    const updatedRecord = await updateFileRecord(id, {
      additionalImages: updatedGallery,
    });

    if (!updatedRecord) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update database metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<UploadedFile>>(
      {
        success: true,
        data: updatedRecord,
        message: 'Image added to page successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Add additional image error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to add image' },
      { status: 500 }
    );
  }
}

// ── DELETE: Remove an additional image from this file's page ───────────────────

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'imageId parameter is required' },
        { status: 400 }
      );
    }

    const fileRecord = await getFileById(id);

    if (!fileRecord) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File record not found' },
        { status: 404 }
      );
    }

    const gallery = fileRecord.additionalImages || [];
    const imageToDelete = gallery.find((img) => img.id === imageId);

    if (!imageToDelete) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Image not found in gallery' },
        { status: 404 }
      );
    }

    // ── Delete Object from R2 ────────────────────────────────────────────

    try {
      await r2Delete(imageToDelete.githubPath);
    } catch (error) {
      console.warn('Failed to delete object from R2 during gallery clean, removing from metadata anyway:', error);
    }

    // ── Update Metadata ──────────────────────────────────────────────────

    const updatedGallery = gallery.filter((img) => img.id !== imageId);

    const updatedRecord = await updateFileRecord(id, {
      additionalImages: updatedGallery,
    });

    if (!updatedRecord) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update database metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<UploadedFile>>(
      {
        success: true,
        data: updatedRecord,
        message: 'Image removed from page successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete additional image error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to remove image' },
      { status: 500 }
    );
  }
}
