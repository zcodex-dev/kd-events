import { NextResponse } from 'next/server';
import { getFileById, updateFileRecord } from '@/lib/uploads/metadata';
import type { ApiResponse, UploadedFile, AdditionalImage } from '@/types';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { orderedIds } = await request.json();

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'orderedIds array is required' },
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

    // ── 1. Create a flat list of all current images ──────────────────────────
    const mainImageObj = {
      id: 'main', // Virtual ID for the original primary image
      originalName: fileRecord.originalName,
      storedName: fileRecord.storedName,
      githubPath: fileRecord.githubPath,
      imageUrl: fileRecord.imageUrl,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      width: fileRecord.width,
      height: fileRecord.height,
      uploadedAt: fileRecord.uploadedAt,
    };

    const allImages = [mainImageObj, ...(fileRecord.additionalImages || [])];

    // ── 2. Reorder them according to the orderedIds list ─────────────────────
    const reorderedList: typeof allImages = [];
    
    for (const imageId of orderedIds) {
      const img = allImages.find((item) => item.id === imageId);
      if (img) {
        reorderedList.push(img);
      }
    }

    // Append any images that were omitted in orderedIds (safety fallback)
    for (const img of allImages) {
      if (!reorderedList.some((item) => item.id === img.id)) {
        reorderedList.push(img);
      }
    }

    if (reorderedList.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No images to order' },
        { status: 400 }
      );
    }

    // ── 3. Extract the new primary image and additional gallery list ──────────
    const newPrimary = reorderedList[0];
    const newAdditional: AdditionalImage[] = reorderedList.slice(1).map((img) => ({
      id: img.id === 'main' ? 'main-' + nanoid(6) : img.id, // Ensure virtual ID isn't duplicated in secondary gallery
      originalName: img.originalName,
      storedName: img.storedName,
      githubPath: img.githubPath,
      imageUrl: img.imageUrl,
      mimeType: img.mimeType,
      size: img.size,
      width: img.width,
      height: img.height,
      uploadedAt: img.uploadedAt,
    }));

    // Update main record values
    const updatedRecord = await updateFileRecord(id, {
      originalName: newPrimary.originalName,
      storedName: newPrimary.storedName,
      githubPath: newPrimary.githubPath,
      imageUrl: newPrimary.imageUrl,
      mimeType: newPrimary.mimeType,
      size: reorderedList.reduce((acc, img) => acc + img.size, 0), // Recalculate total combined size
      width: newPrimary.width,
      height: newPrimary.height,
      uploadedAt: newPrimary.uploadedAt, // Keep original upload timestamp of this primary item
      additionalImages: newAdditional.length > 0 ? newAdditional : undefined,
    });

    if (!updatedRecord) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to save reordered record metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<UploadedFile>>(
      {
        success: true,
        data: updatedRecord,
        message: 'Gallery images reordered successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Reorder error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to reorder images' },
      { status: 500 }
    );
  }
}

// Generate simple short nanoid fallback
function nanoid(size = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let str = '';
  for (let i = 0; i < size; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
