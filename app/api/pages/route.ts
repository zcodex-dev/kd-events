import { NextResponse } from 'next/server';
import { getAllWebPages, addWebPage } from '@/lib/uploads/metadata';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse, WebPage } from '@/types';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const pages = await getAllWebPages();
    return NextResponse.json<ApiResponse<WebPage[]>>({ success: true, data: pages }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch web pages error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch web pages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized. Super admin required.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, htmlContent, textColor, bgColor, bgImageUrl, featureIconUrl } = body;

    if (!title || !htmlContent) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Title and content are required' }, { status: 400 });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + crypto.randomUUID().split('-')[0];

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
    const shareUrl = `${baseUrl}/terms/${slug}`;

    const newPage: WebPage = {
      id: crypto.randomUUID(),
      slug,
      title,
      htmlContent,
      textColor: textColor || '#ffffff',
      bgColor: bgColor || '#000000',
      bgImageUrl,
      featureIconUrl,
      createdAt: new Date().toISOString(),
      viewCount: 0,
      shareUrl,
    };

    await addWebPage(newPage);

    return NextResponse.json<ApiResponse<WebPage>>({ success: true, data: newPage, message: 'Web page created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Create web page error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create web page' }, { status: 500 });
  }
}
