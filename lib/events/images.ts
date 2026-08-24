import { uploadFile } from '@/lib/r2/client';
import { generateUniqueFileName, generateUploadPath } from '@/lib/uploads/file-utils';
import { validateFileSize, MAX_FILE_SIZE } from '@/lib/validation/schemas';
import { getAppConfig } from '@/lib/uploads/metadata';

export const MAX_EVENT_IMAGES = 3;

/**
 * Rows created before the `images` array existed only have `imageUrl`.
 * Read through this so both shapes render the same way.
 */
export function eventImages(event: { images?: string[] | null; imageUrl?: string | null }): string[] {
  if (event.images?.length) return event.images;
  return event.imageUrl ? [event.imageUrl] : [];
}

function normalizeUrl(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

async function storeFile(file: File): Promise<string> {
  const uploadFolder = process.env.GITHUB_UPLOAD_FOLDER || 'public-uploads';
  const storedName = generateUniqueFileName(file.name);
  const r2Key = generateUploadPath(uploadFolder, storedName, new Date());

  const arrayBuffer = await file.arrayBuffer();
  await uploadFile(r2Key, Buffer.from(arrayBuffer), file.type);

  let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
    appUrl = `https://${appUrl}`;
  }
  return `${appUrl}/api/raw/${r2Key}`;
}

/**
 * Reads the three image slots off a multipart form and returns the resolved
 * URLs in slot order, with empty slots collapsed out.
 *
 * Per slot `i` (1-based), precedence is:
 *   imageUrl{i}      — a pasted link
 *   image{i}         — an uploaded file
 *   existingImage{i} — an already-saved URL the editor left untouched
 *
 * A slot the client sends nothing for is treated as cleared, which is how
 * removing an image works on edit.
 */
export async function resolveEventImages(
  formData: FormData
): Promise<{ images: string[] } | { error: string }> {
  const images: string[] = [];

  for (let slot = 1; slot <= MAX_EVENT_IMAGES; slot += 1) {
    const url = ((formData.get(`imageUrl${slot}`) as string) || '').trim();
    const file = formData.get(`image${slot}`) as File | null;
    const existing = ((formData.get(`existingImage${slot}`) as string) || '').trim();

    if (url) {
      const normalized = normalizeUrl(url);
      if (!normalized) {
        return { error: `Image ${slot}: URL must be a valid http:// or https:// link` };
      }
      images.push(normalized);
      continue;
    }

    if (file && file.size > 0) {
      const config = await getAppConfig();
      if (!config.allowedTypes.includes(file.type)) {
        return { error: `Image ${slot}: unsupported file type` };
      }
      if (!validateFileSize(file.size, MAX_FILE_SIZE)) {
        return { error: `Image ${slot}: file is too large` };
      }
      images.push(await storeFile(file));
      continue;
    }

    if (existing) {
      const normalized = normalizeUrl(existing);
      if (normalized) images.push(normalized);
    }
  }

  return { images };
}
