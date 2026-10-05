import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid items array' },
        { status: 400 }
      );
    }

    // Execute atomic batch order update
    await prisma.$transaction(
      items.map((item: { id: string; orderIndex: number }) =>
        prisma.event.update({
          where: { id: item.id },
          data: { orderIndex: Number(item.orderIndex) },
        })
      )
    );
    // Revalidate paths so changes show immediately
    try {
      revalidatePath('/');
      revalidatePath('/dashboard/events');
    } catch (e) {
      // safe fallback if called outside request context
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error reordering events:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to reorder events' },
      { status: 500 }
    );
  }
}
