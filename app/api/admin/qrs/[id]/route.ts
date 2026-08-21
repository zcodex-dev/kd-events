import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, type, destinationUrl, content, fgColor, bgColor, logoUrl, isActive } = body;

    const qr = await prisma.dynamicQR.update({
      where: { id },
      data: {
        name,
        type,
        destinationUrl: destinationUrl || null,
        content: content || null,
        fgColor,
        bgColor,
        logoUrl: logoUrl || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: qr });
  } catch (error) {
    console.error('Error updating QR:', error);
    return NextResponse.json({ success: false, error: 'Failed to update QR code' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.dynamicQR.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting QR:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete QR code' }, { status: 500 });
  }
}
