import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { resolveEventImages, resolveTelegramImage } from '@/lib/events/images';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.orderIndex !== undefined) updateData.orderIndex = Number(data.orderIndex);

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    try {
      revalidatePath('/');
      revalidatePath('/dashboard/events');
    } catch (e) {
      // safe fallback
    }

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
    const titleZh = formData.get('titleZh') as string;
    const descriptionZh = formData.get('descriptionZh') as string;
    const titleId = formData.get('titleId') as string;
    const descriptionId = formData.get('descriptionId') as string;

    const tag = formData.get('tag') as string;
    const date = formData.get('date') as string;
    const startAtRaw = formData.get('startAt') as string;
    const endAtRaw = formData.get('endAt') as string;
    const location = formData.get('location') as string;
    const dateZh = formData.get('dateZh') as string;
    const dateId = formData.get('dateId') as string;
    const locationZh = formData.get('locationZh') as string;
    const locationId = formData.get('locationId') as string;
    const concept = formData.get('concept') as string;
    const conceptZh = formData.get('conceptZh') as string;
    const conceptId = formData.get('conceptId') as string;
    const status = formData.get('status') as string || 'ACTIVE';
    const orderIndex = parseInt(formData.get('orderIndex') as string || '0', 10);
    const defaultLang = (formData.get('defaultLang') as string) || 'en';

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const startAt = startAtRaw ? new Date(startAtRaw) : null;
    const endAt = endAtRaw ? new Date(endAtRaw) : null;
    if (!startAt || !endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      return NextResponse.json({ success: false, error: 'Valid event start and end times are required' }, { status: 400 });
    }
    if (endAt <= startAt) {
      return NextResponse.json({ success: false, error: 'Event end must be after the start' }, { status: 400 });
    }

    const resolved = await resolveEventImages(formData);
    if ('error' in resolved) {
      return NextResponse.json({ success: false, error: resolved.error }, { status: 400 });
    }

    const resolvedTelegram = await resolveTelegramImage(formData);
    if ('error' in resolvedTelegram) {
      return NextResponse.json({ success: false, error: resolvedTelegram.error }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description: description || null,
        titleZh: titleZh || null,
        descriptionZh: descriptionZh || null,
        titleId: titleId || null,
        descriptionId: descriptionId || null,
        dateZh: dateZh || null,
        dateId: dateId || null,
        locationZh: locationZh || null,
        locationId: locationId || null,
        concept: concept || null,
        conceptZh: conceptZh || null,
        conceptId: conceptId || null,
        tag: tag || null,
        date: date || null,
        startAt,
        endAt,
        location: location || null,
        status,
        orderIndex,
        defaultLang: ['en', 'id', 'zh'].includes(defaultLang) ? defaultLang : 'en',
        images: resolved.images,
        imageUrl: resolved.images[0] ?? null,
        telegramImageUrl: resolvedTelegram.url,
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
