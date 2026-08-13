import { z } from 'zod';

// ─── Allowed File Types ──────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.mp4',
  '.webm',
  '.mov',
] as const;

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// ─── Login Schema ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  personnelId: z.string().min(1, 'Personnel ID is required'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Upload Validation ──────────────────────────────────────────────────────

export const uploadFileSchema = z.object({
  name: z.string().min(1),
  size: z
    .number()
    .max(MAX_FILE_SIZE, `File size must be under ${MAX_FILE_SIZE / 1024 / 1024} MB`),
  type: z.enum(ALLOWED_MIME_TYPES, {
    message: 'Allowed formats: JPG, PNG, WebP, GIF, SVG, MP4, WebM, MOV',
  }),
});

// ─── Rename Schema ───────────────────────────────────────────────────────────

export const renameSchema = z.object({
  name: z
    .string()
    .min(1, 'File name is required')
    .max(200, 'File name is too long')
    .regex(
      /^[a-zA-Z0-9_\-. ]+$/,
      'File name can only contain letters, numbers, spaces, hyphens, underscores, and dots'
    ),
});

export type RenameFormData = z.infer<typeof renameSchema>;

// ─── Server-side File Validation ─────────────────────────────────────────────

/** Dangerous file extensions that should never be accepted */
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.js', '.jsx', '.ts', '.tsx', '.vbs', '.vbe', '.wsf', '.wsh',
  '.ps1', '.psm1', '.sh', '.bash', '.csh', '.ksh',
  '.svg', '.html', '.htm', '.xhtml', '.xml',
  '.php', '.py', '.rb', '.pl', '.cgi',
  '.dll', '.sys', '.drv', '.ocx',
];

export function validateFileExtension(filename: string): boolean {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(ext)) return false;
  return ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number]);
}

export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number]);
}

export function validateFileSize(size: number, maxSize: number = MAX_FILE_SIZE): boolean {
  return size > 0 && size <= maxSize;
}
