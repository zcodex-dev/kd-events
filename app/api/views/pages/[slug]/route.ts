import { NextResponse } from 'next/server';
import { incrementWebPageViewCount } from '@/lib/uploads/metadata';
import type { ApiResponse } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // We don't await this to avoid blocking the response
    incrementWebPageViewCount(slug).catch(console.error);

    return NextResponse.json<ApiResponse>({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
