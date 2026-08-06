import { NextResponse } from 'next/server';
import { getTvScreenBySlug, incrementTvScreenViewCount } from '@/lib/uploads/metadata';
import type { ApiResponse, TvScreen } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const screen = await getTvScreenBySlug(slug);

    if (!screen || !screen.enabled) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'TV Screen not found or disabled' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<TvScreen>>(
      { success: true, data: screen },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        }
      }
    );
  } catch (error: any) {
    console.error('Fetch public TV screen error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch TV screen' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await incrementTvScreenViewCount(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
