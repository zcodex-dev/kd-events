import { NextResponse } from 'next/server';
import { getAllTvScreens, addTvScreen } from '@/lib/uploads/metadata';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse, TvScreen } from '@/types';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const screens = await getAllTvScreens();
    return NextResponse.json<ApiResponse<TvScreen[]>>({ success: true, data: screens }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch TV screens error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch TV screens' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized. Super admin required.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      enabled = true,
      mediaUrl,
      mediaType = 'auto',
      mediaFit = 'cover',
      bgColor = '#000000',
      overlayOpacity = 0,
      overlayText,
      refreshIntervalSeconds = 5,
    } = body;

    if (!title || !mediaUrl) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Screen title and Media URL (Video/GIF/Image) are required' }, { status: 400 });
    }

    // Determine media type if auto
    let determinedType: 'video' | 'gif' | 'image' = 'image';
    if (mediaType === 'video' || mediaUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
      determinedType = 'video';
    } else if (mediaType === 'gif' || mediaUrl.match(/\.gif(\?.*)?$/i)) {
      determinedType = 'gif';
    } else if (mediaType === 'image') {
      determinedType = 'image';
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + crypto.randomUUID().split('-')[0];

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
    const shareUrl = `${baseUrl}/tv/${slug}`;
    const now = new Date().toISOString();

    const newScreen: TvScreen = {
      id: crypto.randomUUID(),
      slug,
      title,
      enabled,
      mediaUrl,
      mediaType: determinedType,
      mediaFit,
      bgColor,
      overlayOpacity: Number(overlayOpacity) || 0,
      overlayText: overlayText || {
        enabled: false,
        headline: '',
        subtext: '',
        position: 'bottom',
        textColor: '#ffffff',
        bgColor: 'rgba(0, 0, 0, 0.7)',
        showGlow: false,
      },
      refreshIntervalSeconds: Number(refreshIntervalSeconds) || 5,
      viewCount: 0,
      shareUrl,
      createdAt: now,
      updatedAt: now,
    };

    await addTvScreen(newScreen);

    return NextResponse.json<ApiResponse<TvScreen>>({ success: true, data: newScreen, message: 'TV Display created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Create TV screen error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create TV screen' }, { status: 500 });
  }
}
