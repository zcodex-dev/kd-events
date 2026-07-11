import { NextResponse } from 'next/server';
import { incrementViewCount } from '@/lib/uploads/metadata';
import type { ApiResponse } from '@/types';

type RouteParams = { params: Promise<{ slug: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    await incrementViewCount(slug);

    return NextResponse.json<ApiResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    // View count increment failures are non-critical; log and return success
    console.error('View count error:', error);
    return NextResponse.json<ApiResponse>(
      { success: true },
      { status: 200 }
    );
  }
}
