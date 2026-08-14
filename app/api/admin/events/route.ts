import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveEventImages } from '@/lib/events/images';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tag = formData.get('tag') as string;
    const date = formData.get('date') as string;
    const location = formData.get('location') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const resolved = await resolveEventImages(formData);
    if ('error' in resolved) {
      return NextResponse.json({ success: false, error: resolved.error }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        tag: tag || null,
        date: date || null,
        location: location || null,
        images: resolved.images,
        // Kept in sync so anything still reading the single-image field works.
        imageUrl: resolved.images[0] ?? null,
        isActive: isActive,
      }
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json({ success: false, error: `Failed to create event: ${error.message || String(error)}` }, { status: 500 });
  }
}
