import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveEventImages } from '@/lib/events/images';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const data = await request.json();

    const event = await prisma.event.update({
      where: { id },
      data: {
        status: data.status,
      }
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json({ success: false, error: 'Failed to update event' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tag = formData.get('tag') as string;
    const date = formData.get('date') as string;
    const location = formData.get('location') as string;
    const status = formData.get('status') as string || 'ACTIVE';
    const orderIndex = parseInt(formData.get('orderIndex') as string || '0', 10);

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const resolved = await resolveEventImages(formData);
    if ('error' in resolved) {
      return NextResponse.json({ success: false, error: resolved.error }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description: description || null,
        tag: tag || null,
        date: date || null,
        location: location || null,
        status,
        orderIndex,
        images: resolved.images,
        imageUrl: resolved.images[0] ?? null,
      }
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json({ success: false, error: `Failed to update event: ${error.message || String(error)}` }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete event' }, { status: 500 });
  }
}
