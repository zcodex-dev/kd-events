import { NextResponse } from 'next/server';
import { uploadFile, getPublicUrl } from '@/lib/r2/client';
import { addFile } from '@/lib/uploads/metadata';
import {
  generateUniqueFileName,
  generateUploadPath,
  generateSlug,
  sanitizeFileName,
} from '@/lib/uploads/file-utils';
import {
  validateFileExtension,
  validateMimeType,
  validateFileSize,
  MAX_FILE_SIZE,
} from '@/lib/validation/schemas';
import type { ApiResponse, UploadedFile, UploadResult } from '@/types';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // ── Server-side validation ──────────────────────────────────────────

    if (!validateMimeType(file.type)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' },
        { status: 400 }
      );
    }

    if (!validateFileExtension(file.name)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid file extension.' },
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

    // ── Process file ────────────────────────────────────────────────────

    const uploadFolder = process.env.GITHUB_UPLOAD_FOLDER || 'public-uploads'; // Reuse same layout folder config name or R2 key prefix
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
      appUrl = `https://${appUrl}`;
    }

    const originalName = sanitizeFileName(file.name);
    const storedName = generateUniqueFileName(originalName);
    const now = new Date();
    const r2Key = generateUploadPath(uploadFolder, storedName, now);

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read dimensions from form data if provided
    const width = formData.get('width');
    const height = formData.get('height');

    // ── Upload to Cloudflare R2 ─────────────────────────────────────────

    await uploadFile(
      r2Key,
      buffer,
      file.type
    );

    // ── Build file record ───────────────────────────────────────────────

    const slug = generateSlug();
    const imageUrl = getPublicUrl(r2Key);
    const shareUrl = `${appUrl}/view/${slug}`;

    const fileRecord: UploadedFile = {
      id: nanoid(16),
      slug,
      originalName,
      storedName,
      githubPath: r2Key, // Keep naming structure compatible or map to r2Key
      imageUrl,
      shareUrl,
      mimeType: file.type,
      size: file.size,
      width: width ? parseInt(width as string, 10) : undefined,
      height: height ? parseInt(height as string, 10) : undefined,
      uploadedAt: now.toISOString(),
      viewCount: 0,
    };

    // ── Save metadata ───────────────────────────────────────────────────

    await addFile(fileRecord);

    // ── Return result ───────────────────────────────────────────────────

    const result: UploadResult = {
      file: fileRecord,
      shareUrl,
      imageUrl,
    };

    return NextResponse.json<ApiResponse<UploadResult>>(
      { success: true, data: result, message: 'File uploaded successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
