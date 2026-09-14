import { getFileStream, R2ApiError } from '@/lib/r2/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return new Response('Missing key parameter', { status: 400 });
    }

    // Prevent path traversal
    if (key.includes('..')) {
      return new Response('Forbidden path', { status: 403 });
    }

    const range = request.headers.get('range');
    const { body, contentType, contentLength, contentRange, status } = await getFileStream(key, range);

    const headers: Record<string, string> = {
      'Content-Type': contentType || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    if (contentLength !== undefined) {
      headers['Content-Length'] = String(contentLength);
    }
    if (contentRange) {
      headers['Content-Range'] = contentRange;
    }

    return new Response(body, {
      status,
      headers,
    });
  } catch (error) {
    if (error instanceof R2ApiError && error.status === 404) {
      return new Response('File not found', { status: 404 });
    }
    console.error('Raw file fetch error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
