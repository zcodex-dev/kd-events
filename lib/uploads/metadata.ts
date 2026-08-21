import type { UploadedFile, MetadataIndex, AppConfig, SubUser, WebPage, TvScreen } from '@/types';
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

export const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

/**
 * Get application configuration.
 */
export async function getAppConfig(): Promise<AppConfig> {
  const index = await readIndex();
  const allowed = index.config?.allowedTypes && index.config.allowedTypes.length > 0
    ? index.config.allowedTypes
    : DEFAULT_ALLOWED_TYPES;

  return {
    ...index.config,
    allowedTypes: allowed,
  };
}

/**
 * Update application configuration.
 */
export async function updateAppConfig(config: AppConfig): Promise<AppConfig> {
  const index = await readIndex();
  index.config = config;
  await writeIndex(index);
  return config;
}

/**
 * Get all sub-users.
 */
export async function getAllUsers(): Promise<SubUser[]> {
  const index = await readIndex();
  return index.users || [];
}

/**
 * Find a user by username.
 */
export async function getUserByUsername(username: string): Promise<SubUser | null> {
  const index = await readIndex();
  return (index.users || []).find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
}

/**
 * Add a new user.
 */
export async function addUser(user: SubUser): Promise<void> {
  const index = await readIndex();
  if (!index.users) index.users = [];
  index.users.push(user);
  await writeIndex(index);
}

/**
 * Update an existing user's details/permissions.
 */
export async function updateUser(id: string, updates: Partial<SubUser>): Promise<SubUser | null> {
  const index = await readIndex();
  if (!index.users) return null;
  const userIdx = index.users.findIndex((u) => u.id === id);
  if (userIdx === -1) return null;
  index.users[userIdx] = { ...index.users[userIdx], ...updates };
  await writeIndex(index);
  return index.users[userIdx];
}

/**
 * Remove a user by ID.
 */
export async function removeUser(id: string): Promise<boolean> {
  const index = await readIndex();
  if (!index.users) return false;
  const initialLength = index.users.length;
  index.users = index.users.filter((u) => u.id !== id);
  if (index.users.length === initialLength) return false;
  await writeIndex(index);
  return true;
}

// ─── Folders ───────────────────────────────────────────────────────────────────

export async function getAllFolders(): Promise<FolderConfig[]> {
  const index = await readIndex();
  return index.folders || [];
}

export async function addFolder(folder: FolderConfig): Promise<void> {
  const index = await readIndex();
  if (!index.folders) index.folders = [];
  index.folders.push(folder);
  await writeIndex(index);
}

// ─── Web Pages ───────────────────────────────────────────────────────────────

export async function getAllWebPages(): Promise<WebPage[]> {
  const index = await readIndex();
  return index.webPages || [];
}

export async function getWebPageById(id: string): Promise<WebPage | null> {
  const index = await readIndex();
  return (index.webPages || []).find((p) => p.id === id) || null;
}

export async function getWebPageBySlug(slug: string): Promise<WebPage | null> {
  const index = await readIndex();
  return (index.webPages || []).find((p) => p.slug === slug) || null;
}

export async function addWebPage(page: WebPage): Promise<void> {
  const index = await readIndex();
  if (!index.webPages) index.webPages = [];
  index.webPages.unshift(page);
  await writeIndex(index);
}

export async function updateWebPage(id: string, updates: Partial<WebPage>): Promise<WebPage | null> {
  const index = await readIndex();
  if (!index.webPages) return null;
  const pageIdx = index.webPages.findIndex((p) => p.id === id);
  if (pageIdx === -1) return null;
  index.webPages[pageIdx] = { ...index.webPages[pageIdx], ...updates };
  await writeIndex(index);
  return index.webPages[pageIdx];
}

export async function removeWebPage(id: string): Promise<boolean> {
  const index = await readIndex();
  if (!index.webPages) return false;
  const initialLength = index.webPages.length;
  index.webPages = index.webPages.filter((p) => p.id !== id);
  if (index.webPages.length === initialLength) return false;
  await writeIndex(index);
  return true;
}

export async function incrementWebPageViewCount(slug: string): Promise<void> {
  const index = await readIndex();
  if (!index.webPages) return;
  const page = index.webPages.find((p) => p.slug === slug);
  if (page) {
    page.viewCount = (page.viewCount || 0) + 1;
    await writeIndex(index);
  }
}

// ─── TV Screens / LCD Displays ───────────────────────────────────────────────

export async function getAllTvScreens(): Promise<TvScreen[]> {
  const index = await readIndex();
  return index.screens || [];
}

export async function getTvScreenById(id: string): Promise<TvScreen | null> {
  const index = await readIndex();
  return (index.screens || []).find((s) => s.id === id) || null;
}

export async function getTvScreenBySlug(slug: string): Promise<TvScreen | null> {
  const index = await readIndex();
  return (index.screens || []).find((s) => s.slug === slug) || null;
}

export async function addTvScreen(screen: TvScreen): Promise<void> {
  const index = await readIndex();
  if (!index.screens) index.screens = [];
  index.screens.unshift(screen);
  await writeIndex(index);
}

export async function updateTvScreen(id: string, updates: Partial<TvScreen>): Promise<TvScreen | null> {
  const index = await readIndex();
  if (!index.screens) return null;
  const screenIdx = index.screens.findIndex((s) => s.id === id);
  if (screenIdx === -1) return null;
  index.screens[screenIdx] = { 
    ...index.screens[screenIdx], 
    ...updates, 
    updatedAt: new Date().toISOString() 
  };
  await writeIndex(index);
  return index.screens[screenIdx];
}

export async function removeTvScreen(id: string): Promise<boolean> {
  const index = await readIndex();
  if (!index.screens) return false;
  const initialLength = index.screens.length;
  index.screens = index.screens.filter((s) => s.id !== id);
  if (index.screens.length === initialLength) return false;
  await writeIndex(index);
  return true;
}

export async function incrementTvScreenViewCount(slug: string): Promise<void> {
  const index = await readIndex();
  if (!index.screens) return;
  const screen = index.screens.find((s) => s.slug === slug);
  if (screen) {
    screen.viewCount = (screen.viewCount || 0) + 1;
    await writeIndex(index);
  }
}


