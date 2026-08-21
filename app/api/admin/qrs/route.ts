import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const qrs = await prisma.dynamicQR.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: qrs });
  } catch (error) {
    console.error('Error fetching QRs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch QRs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, destinationUrl, content, fgColor, bgColor, logoUrl } = body;

    if (!name || !type) {
      return NextResponse.json({ success: false, error: 'Name and Type are required' }, { status: 400 });
    }

    const qr = await prisma.dynamicQR.create({
      data: {
        name,
        type,
        destinationUrl: destinationUrl || null,
        content: content || null,
        fgColor: fgColor || '#000000',
        bgColor: bgColor || '#ffffff',
        logoUrl: logoUrl || null,
      },
    });

    return NextResponse.json({ success: true, data: qr });
  } catch (error) {
    console.error('Error creating QR:', error);
    return NextResponse.json({ success: false, error: 'Failed to create QR code' }, { status: 500 });
  }
}
