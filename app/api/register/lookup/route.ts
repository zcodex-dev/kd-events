import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Verifies a Member ID and returns the profile card data.
 *
 * Deliberately read-only: the visitor-facing "Login" step only confirms who
 * they are. The Registration row is written later, by /api/register, when they
 * press "Register Event" — otherwise every ID check would leave a stray row.
 *
 * Public route (proxy.ts exempts everything under /api/register).
 */
export async function POST(request: Request) {
  try {
    const { memberId } = await request.json();

    if (!memberId || typeof memberId !== 'string' || !memberId.trim()) {
      return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { memberId: memberId.trim() },
      select: {
        memberId: true,
        name: true,
        memberType: true,
        nationality: true,
        dateJoined: true,
        createdAt: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          notFound: true,
          error: 'Member ID not found. Please register as a Non-Member.',
        },
        { status: 404 }
      );
    }

    // Events this member has already registered for, newest first.
    const registrations = await prisma.registration.findMany({
      where: { memberId: member.memberId, eventTitle: { not: null } },
      select: { eventId: true, eventTitle: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    // The profile photo is uploaded against a Registration in Manage Players,
    // not the Member record — take the most recent one that has an avatar.
    const withAvatar = await prisma.registration.findFirst({
      where: { memberId: member.memberId, avatarUrl: { not: null } },
      select: { avatarUrl: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      member: {
        ...member,
        // The card labels this "Card Serial".
        cardSerial: member.memberId,
        avatarUrl: withAvatar?.avatarUrl ?? null,
      },
      events: registrations,
    });
  } catch (error: any) {
    console.error('Member lookup error:', error);
    return NextResponse.json({ success: false, error: 'Failed to look up member' }, { status: 500 });
  }
}
