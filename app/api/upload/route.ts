import { NextResponse } from 'next/server';
import { uploadFile, getPublicUrl } from '@/lib/r2/client';
import { addFile, getAppConfig } from '@/lib/uploads/metadata';
import {
  generateUniqueFileName,
  generateUploadPath,
  generateSlug,
  sanitizeFileName,
} from '@/lib/uploads/file-utils';
import {
  validateFileSize,
  MAX_FILE_SIZE,
} from '@/lib/validation/schemas';
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

    const formData = await request.formData();
    
    // Support either multiple files ('files') or a single file ('file')
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;
    
    const filesToUpload = files.length > 0 ? files : (singleFile ? [singleFile] : []);

    if (filesToUpload.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    const customTitle = formData.get('title') as string | null;

    // ── Server-side validation ──────────────────────────────────────────
    const config = await getAppConfig();

    for (const file of filesToUpload) {
      if (!config.allowedTypes.includes(file.type)) {
        const allowedNames = config.allowedTypes
          .map((t) => t.split('/')[1]?.toUpperCase() || t)
          .join(', ');
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Invalid file type: ${file.name}. Allowed formats: ${allowedNames || 'None'}`,
          },
          { status: 400 }
        );
      }

      if (!validateFileSize(file.size, MAX_FILE_SIZE)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `File ${file.name} too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
          },
          { status: 400 }
        );
      }
    }

    // ── Process files ────────────────────────────────────────────────────
    const uploadFolder = process.env.GITHUB_UPLOAD_FOLDER || 'public-uploads';
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
      appUrl = `https://${appUrl}`;
    }

    const now = new Date();
    const slug = generateSlug();
    const shareUrl = `${appUrl}/view/${slug}`;

    // Process Primary/First file
    const primaryFile = filesToUpload[0];
    const primaryOriginalName = customTitle && customTitle.trim() 
      ? sanitizeFileName(customTitle.trim()) 
      : sanitizeFileName(primaryFile.name);
    const primaryStoredName = generateUniqueFileName(primaryOriginalName);
    const primaryR2Key = generateUploadPath(uploadFolder, primaryStoredName, now);

    const primaryArrayBuffer = await primaryFile.arrayBuffer();
    await uploadFile(primaryR2Key, Buffer.from(primaryArrayBuffer), primaryFile.type);

    const primaryWidth = formData.get('width') || formData.get('width_0');
    const primaryHeight = formData.get('height') || formData.get('height_0');

    // Process Additional files (if any)
    const additionalImages: AdditionalImage[] = [];
    for (let i = 1; i < filesToUpload.length; i++) {
      const addFileObj = filesToUpload[i];
      const addOriginalName = sanitizeFileName(addFileObj.name);
      const addStoredName = generateUniqueFileName(addOriginalName);
      const addR2Key = generateUploadPath(uploadFolder, addStoredName, now);

      const addArrayBuffer = await addFileObj.arrayBuffer();
      await uploadFile(addR2Key, Buffer.from(addArrayBuffer), addFileObj.type);

      const addWidth = formData.get(`width_${i}`);
      const addHeight = formData.get(`height_${i}`);

      additionalImages.push({
        id: nanoid(12),
        originalName: addOriginalName,
        storedName: addStoredName,
        githubPath: addR2Key,
        imageUrl: getPublicUrl(addR2Key),
        mimeType: addFileObj.type,
        size: addFileObj.size,
        width: addWidth ? parseInt(addWidth as string, 10) : undefined,
        height: addHeight ? parseInt(addHeight as string, 10) : undefined,
        uploadedAt: now.toISOString(),
      });
    }

    // ── Build file record ───────────────────────────────────────────────
    const fileRecord: UploadedFile = {
      id: nanoid(16),
      slug,
      originalName: primaryOriginalName,
      storedName: primaryStoredName,
      githubPath: primaryR2Key,
      imageUrl: getPublicUrl(primaryR2Key),
      shareUrl,
      mimeType: primaryFile.type,
      size: filesToUpload.reduce((acc, f) => acc + f.size, 0), // Total size of all files in album
      width: primaryWidth ? parseInt(primaryWidth as string, 10) : undefined,
      height: primaryHeight ? parseInt(primaryHeight as string, 10) : undefined,
      uploadedAt: now.toISOString(),
      viewCount: 0,
      additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
    };

    // ── Save metadata ───────────────────────────────────────────────────
    await addFile(fileRecord);

    // ── Return result ───────────────────────────────────────────────────
    const result: UploadResult = {
      file: fileRecord,
      shareUrl,
      imageUrl: fileRecord.imageUrl,
    };

    return NextResponse.json<ApiResponse<UploadResult>>(
      { 
        success: true, 
        data: result, 
        message: filesToUpload.length > 1 ? 'Album uploaded successfully' : 'File uploaded successfully' 
      },
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
