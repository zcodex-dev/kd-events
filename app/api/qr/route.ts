import { NextResponse } from 'next/server';
import { generateQRCodeDataUrl } from '@/lib/qr';
import type { ApiResponse } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    const qrDataUrl = await generateQRCodeDataUrl(url);

    return NextResponse.json<ApiResponse<{ qrCode: string }>>(
      { success: true, data: { qrCode: qrDataUrl } },
      { status: 200 }
    );
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
