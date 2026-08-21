import type { UploadResult } from '@/types';

type UploadOptions = {
  onProgress?: (percent: number) => void;
  width?: number;
  height?: number;
  title?: string;
  folder?: string;
};

/**
 * Direct client-to-R2 upload using presigned URLs.
 * This completely avoids Vercel's 4.5MB Serverless Function payload limit,
 * enabling uploads up to 100MB+ (MP4 videos, GIFs, high-res artworks).
 */
export async function directUploadSingleFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { onProgress, width, height, title, folder } = options;

  // 1. Get Presigned URL from server
  const presignRes = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
    }),
  });

  const presignData = await presignRes.json();
  if (!presignData.success || !presignData.data) {
    throw new Error(presignData.error || 'Failed to authorize upload');
  }

  const { uploadUrl, key, storedName, slug } = presignData.data;

  // 2. Direct PUT to Cloudflare R2 with progress tracking
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);

    if (file.type) {
      xhr.setRequestHeader('Content-Type', file.type);
    }

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 90);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(`Direct storage upload failed with status ${xhr.status}`)
        );
      }
    };

    xhr.onerror = () => reject(new Error('Network error uploading to storage'));
    xhr.ontimeout = () => reject(new Error('Storage upload timed out'));
    xhr.send(file);
  });

  if (onProgress) onProgress(95);

  // 3. Complete and save record in metadata index
  const completeRes = await fetch('/api/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key,
      slug,
      storedName,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      width,
      height,
      title,
      folder,
    }),
  });

  const completeData = await completeRes.json();
  if (!completeData.success || !completeData.data) {
    throw new Error(completeData.error || 'Failed to finalize upload record');
  }

  if (onProgress) onProgress(100);
  return completeData.data;
}

/**
 * Direct client-to-R2 upload for multiple files grouped into an Album.
 */
export async function directUploadAlbum(
  files: Array<{ file: File; width?: number; height?: number }>,
  options: { title?: string; folder?: string; onProgress?: (percent: number) => void } = {}
): Promise<UploadResult> {
  if (files.length === 0) {
    throw new Error('No files provided');
  }

  const { title, folder, onProgress } = options;
  const primary = files[0];

  // 1. Presign and upload primary file
  const primaryPresignRes = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: primary.file.name,
      mimeType: primary.file.type || 'application/octet-stream',
      size: primary.file.size,
    }),
  });

  const primaryPresign = await primaryPresignRes.json();
  if (!primaryPresign.success || !primaryPresign.data) {
    throw new Error(primaryPresign.error || 'Failed to authorize upload');
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', primaryPresign.data.uploadUrl, true);
    if (primary.file.type) xhr.setRequestHeader('Content-Type', primary.file.type);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Storage upload failed')));
    xhr.onerror = () => reject(new Error('Storage upload network error'));
    xhr.send(primary.file);
  });

  // 2. Presign and upload additional files
  const additionalImages = [];
  for (let i = 1; i < files.length; i++) {
    const add = files[i];
    const addPresignRes = await fetch('/api/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: add.file.name,
        mimeType: add.file.type || 'application/octet-stream',
        size: add.file.size,
      }),
    });

    const addPresign = await addPresignRes.json();
    if (addPresign.success && addPresign.data) {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', addPresign.data.uploadUrl, true);
        if (add.file.type) xhr.setRequestHeader('Content-Type', add.file.type);
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Storage upload failed')));
        xhr.onerror = () => reject(new Error('Storage upload network error'));
        xhr.send(add.file);
      });

      additionalImages.push({
        key: addPresign.data.key,
        storedName: addPresign.data.storedName,
        originalName: add.file.name,
        mimeType: add.file.type,
        size: add.file.size,
        width: add.width,
        height: add.height,
        imageUrl: addPresign.data.publicUrl,
      });
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 90));
    }
  }

  // 3. Complete Album
  const completeRes = await fetch('/api/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: primaryPresign.data.key,
      slug: primaryPresign.data.slug,
      storedName: primaryPresign.data.storedName,
      originalName: primary.file.name,
      mimeType: primary.file.type || 'application/octet-stream',
      size: primary.file.size,
      width: primary.width,
      height: primary.height,
      title,
      folder,
      additionalImages,
    }),
  });

  const completeData = await completeRes.json();
  if (!completeData.success || !completeData.data) {
    throw new Error(completeData.error || 'Failed to finalize album');
  }

  if (onProgress) onProgress(100);
  return completeData.data;
}
