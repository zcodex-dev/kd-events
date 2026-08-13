import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ success: false, error: 'Failed to load events' }, { status: 500 });
  }
}
