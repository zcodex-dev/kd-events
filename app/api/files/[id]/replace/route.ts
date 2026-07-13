import { NextResponse } from 'next/server';
import { getFileById, updateFileRecord, getAppConfig } from '@/lib/uploads/metadata';
import { deleteFile as r2Delete, uploadFile, getPublicUrl } from '@/lib/r2/client';
import {
  sanitizeFileName,
  generateUniqueFileName,
  generateUploadPath,
} from '@/lib/uploads/file-utils';
import { validateFileSize, MAX_FILE_SIZE } from '@/lib/validation/schemas';
import type { ApiResponse, UploadedFile } from '@/types';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const fileRecord = await getFileById(id);

    if (!fileRecord) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const newFile = formData.get('file') as File | null;
    const width = formData.get('width');
    const height = formData.get('height');

    if (!newFile) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // ── Validation ───────────────────────────────────────────────────────

    const config = await getAppConfig();

    if (!config.allowedTypes.includes(newFile.type)) {
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

    if (!validateFileSize(newFile.size, MAX_FILE_SIZE)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
        },
        { status: 400 }
      );
    }

    // ── Delete Old Object from R2 ────────────────────────────────────────

    try {
      await r2Delete(fileRecord.githubPath);
    } catch (error) {
      console.warn('Failed to delete old R2 object, proceeding with upload:', error);
    }

    // ── Upload New Object to R2 ──────────────────────────────────────────

    const uploadFolder = process.env.GITHUB_UPLOAD_FOLDER || 'public-uploads';
    const originalName = sanitizeFileName(newFile.name);
    const storedName = generateUniqueFileName(originalName);
    const now = new Date();
    const r2Key = generateUploadPath(uploadFolder, storedName, now);

    const arrayBuffer = await newFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadFile(r2Key, buffer, newFile.type);

    // ── Update Metadata Record ──────────────────────────────────────────

    const updatedImageUrl = getPublicUrl(r2Key);

    const updatedFields: Partial<UploadedFile> = {
      originalName,
      storedName,
      githubPath: r2Key,
      imageUrl: updatedImageUrl,
      mimeType: newFile.type,
      size: newFile.size,
      width: width ? parseInt(width as string, 10) : undefined,
      height: height ? parseInt(height as string, 10) : undefined,
      uploadedAt: now.toISOString(),
    };

    const updatedRecord = await updateFileRecord(id, updatedFields);

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
        message: 'Image replaced successfully while preserving links',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('File replacement error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to replace file' },
      { status: 500 }
    );
  }
}
