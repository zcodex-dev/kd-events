import { NextResponse } from 'next/server';
import { getFile, R2ApiError } from '@/lib/r2/client';

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

    const file = await getFile(key);

    return new Response(new Uint8Array(file.content), {
      status: 200,
      headers: {
        'Content-Type': file.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    if (error instanceof R2ApiError && error.status === 404) {
      return new Response('File not found', { status: 404 });
    }
    console.error('Raw file fetch error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
