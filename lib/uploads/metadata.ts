import type { UploadedFile, MetadataIndex } from '@/types';
import { getFile, uploadFile, R2ApiError } from '@/lib/r2/client';

// ─── Configuration ──────────────────────────────────────────────────────────

const METADATA_KEY = 'data/uploads.json';

// ─── Internal Helpers ───────────────────────────────────────────────────────

/**
 * Read the metadata index file from Cloudflare R2.
 * Returns the parsed index.
 */
async function readIndex(): Promise<MetadataIndex> {
  try {
    const file = await getFile(METADATA_KEY);
    const decoded = file.content.toString('utf-8');
    return JSON.parse(decoded) as MetadataIndex;
  } catch (error) {
    // If the file doesn't exist yet, return an empty index structure
    if (error instanceof R2ApiError && error.status === 404) {
      return { files: [], lastUpdated: new Date().toISOString() };
    }
    throw error;
  }
}

/**
 * Write the metadata index back to Cloudflare R2.
 */
async function writeIndex(index: MetadataIndex): Promise<void> {
  index.lastUpdated = new Date().toISOString();
  const content = JSON.stringify(index, null, 2);
  await uploadFile(METADATA_KEY, content, 'application/json');
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get all uploaded file records.
 */
export async function getAllFiles(): Promise<UploadedFile[]> {
  const index = await readIndex();
  return index.files;
}

/**
 * Get a single file record by ID.
 */
export async function getFileById(id: string): Promise<UploadedFile | null> {
  const index = await readIndex();
  return index.files.find((f) => f.id === id) || null;
}

/**
 * Get a single file record by slug.
 */
export async function getFileBySlug(slug: string): Promise<UploadedFile | null> {
  const index = await readIndex();
  return index.files.find((f) => f.slug === slug) || null;
}

/**
 * Add a new file record to the index.
 */
export async function addFile(file: UploadedFile): Promise<void> {
  const index = await readIndex();
  index.files.unshift(file); // newest first
  await writeIndex(index);
}

/**
 * Update an existing file record.
 */
export async function updateFileRecord(
  id: string,
  updates: Partial<UploadedFile>
): Promise<UploadedFile | null> {
  const index = await readIndex();
  const fileIndex = index.files.findIndex((f) => f.id === id);

  if (fileIndex === -1) return null;

  index.files[fileIndex] = { ...index.files[fileIndex], ...updates };
  await writeIndex(index);

  return index.files[fileIndex];
}

/**
 * Remove a file record from the index.
 */
export async function removeFile(id: string): Promise<boolean> {
  const index = await readIndex();
  const initialLength = index.files.length;
  index.files = index.files.filter((f) => f.id !== id);

  if (index.files.length === initialLength) return false;

  await writeIndex(index);
  return true;
}

/**
 * Increment the view count for a file (by slug).
 */
export async function incrementViewCount(slug: string): Promise<void> {
  const index = await readIndex();
  const file = index.files.find((f) => f.slug === slug);

  if (file) {
    file.viewCount = (file.viewCount || 0) + 1;
    await writeIndex(index);
  }
}

/**
 * Get dashboard statistics.
 */
export async function getStats() {
  const index = await readIndex();
  const files = index.files;
  const now = new Date();

  const todayUploads = files.filter((f) => {
    const d = new Date(f.uploadedAt);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;

  const totalViews = files.reduce((sum, f) => sum + (f.viewCount || 0), 0);
  const storageUsed = files.reduce((sum, f) => sum + f.size, 0);

  return {
    totalFiles: files.length,
    totalViews,
    todayUploads,
    storageUsed,
  };
}
