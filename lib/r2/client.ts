import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// ─── Configuration ──────────────────────────────────────────────────────────

function getConfig() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT; // e.g., https://<account-id>.r2.cloudflarestorage.com
  const bucketName = process.env.R2_BUCKET_NAME || 'kd-events';

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      'Missing required Cloudflare R2 environment variables: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT'
    );
  }

  return { accessKeyId, secretAccessKey, endpoint, bucketName };
}

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const { accessKeyId, secretAccessKey, endpoint } = getConfig();
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3ClientInstance;
}

// ─── Error Handling ─────────────────────────────────────────────────────────

export class R2ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'R2ApiError';
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Upload a file to Cloudflare R2 bucket.
 * Content is a Buffer or a string.
 */
export async function uploadFile(
  key: string,
  content: Buffer | string,
  contentType?: string
): Promise<void> {
  const { bucketName } = getConfig();
  const client = getS3Client();

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: content,
      ContentType: contentType,
    });
    await client.send(command);
  } catch (error: any) {
    console.error('R2 upload error:', error);
    throw new R2ApiError(error.message || 'Failed to upload to R2', 500);
  }
}

/**
 * Delete a file from Cloudflare R2.
 */
export async function deleteFile(key: string): Promise<void> {
  const { bucketName } = getConfig();
  const client = getS3Client();

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await client.send(command);
  } catch (error: any) {
    console.error('R2 delete error:', error);
    throw new R2ApiError(error.message || 'Failed to delete from R2', 500);
  }
}

/**
 * Get a file's content from R2 as a Buffer or string.
 */
export async function getFile(key: string): Promise<{ content: Buffer; contentType?: string }> {
  const { bucketName } = getConfig();
  const client = getS3Client();

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const response = await client.send(command);
    if (!response.Body) {
      throw new R2ApiError('Object body is empty', 404);
    }
    const bytes = await response.Body.transformToByteArray();
    return {
      content: Buffer.from(bytes),
      contentType: response.ContentType,
    };
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      throw new R2ApiError('File not found in R2', 404);
    }
    console.error('R2 get error:', error);
    throw new R2ApiError(error.message || 'Failed to get file from R2', 500);
  }
}

/**
 * Check if a file exists at the given key.
 */
export async function fileExists(key: string): Promise<boolean> {
  const { bucketName } = getConfig();
  const client = getS3Client();

  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Get the public URL for a file.
 * If R2_PUBLIC_URL is provided, we use that as the base.
 * Otherwise, we fall back to a local proxy route.
 */
export function getPublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    // Trim trailing slash from publicUrl
    const base = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    return `${base}/${key}`;
  }
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl}/api/raw?key=${encodeURIComponent(key)}`;
}
