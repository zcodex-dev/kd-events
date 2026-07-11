import { nanoid } from 'nanoid';

// ─── File Name Sanitization ─────────────────────────────────────────────────

/**
 * Sanitize a filename by removing dangerous characters and preventing
 * path traversal attacks. Keeps only alphanumeric, hyphens, underscores, and dots.
 */
export function sanitizeFileName(name: string): string {
  // Remove path components (prevent traversal)
  let sanitized = name.replace(/^.*[/\\]/, '');

  // Remove leading dots (prevent hidden files)
  sanitized = sanitized.replace(/^\.+/, '');

  // Keep only safe characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9_\-. ]/g, '');

  // Replace spaces with hyphens
  sanitized = sanitized.replace(/\s+/g, '-');

  // Collapse multiple hyphens/dots
  sanitized = sanitized.replace(/-+/g, '-');
  sanitized = sanitized.replace(/\.+/g, '.');

  // Trim hyphens and dots from edges
  sanitized = sanitized.replace(/^[-.]|[-.]$/g, '');

  return sanitized || 'unnamed-file';
}

// ─── Unique File Name Generation ────────────────────────────────────────────

/**
 * Generate a unique filename using nanoid while preserving the original extension.
 */
export function generateUniqueFileName(originalName: string): string {
  const sanitized = sanitizeFileName(originalName);
  const ext = getFileExtension(sanitized);
  const nameWithoutExt = sanitized.replace(/\.[^.]+$/, '');

  // Truncate the original name portion to keep it reasonable
  const truncatedName = nameWithoutExt.slice(0, 40);
  const uniqueId = nanoid(10);

  return `${truncatedName}-${uniqueId}${ext}`;
}

// ─── File Extension ─────────────────────────────────────────────────────────

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return '.' + parts.pop()!.toLowerCase();
}

// ─── Upload Path Generation ─────────────────────────────────────────────────

/**
 * Generate the GitHub repository path organized by year/month.
 * Example: public-uploads/2026/07/my-image-abc123.webp
 */
export function generateUploadPath(
  uploadFolder: string,
  storedName: string,
  date: Date = new Date()
): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${uploadFolder}/${year}/${month}/${storedName}`;
}

// ─── Human-Readable File Size ───────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ─── Date Formatting ────────────────────────────────────────────────────────

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Slug Generation ────────────────────────────────────────────────────────

export function generateSlug(): string {
  return nanoid(12);
}

// ─── MIME Type to Extension ─────────────────────────────────────────────────

export function mimeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };
  return map[mimeType] || '.bin';
}

// ─── Check if Today ─────────────────────────────────────────────────────────

export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

// ─── Resolve URL ────────────────────────────────────────────────────────────

/**
 * Rewrites any localhost image or share URLs dynamically to point to the current host origin.
 * This acts as a fallback for files uploaded during testing/misconfiguration.
 */
export function resolveUrl(urlStr: string): string {
  if (typeof window === 'undefined') return urlStr;
  try {
    const url = new URL(urlStr);
    if (
      (url.pathname.startsWith('/api/raw') || url.pathname.startsWith('/view')) &&
      url.host !== window.location.host
    ) {
      url.protocol = window.location.protocol;
      url.host = window.location.host;
      return url.toString();
    }
  } catch {
    // Non-critical parsing fallback
  }
  return urlStr;
}


