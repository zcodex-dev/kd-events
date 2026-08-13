import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const registrations = await prisma.registration.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const members = await prisma.member.findMany();

    // Nationality lives on Member; fold it onto each row so the players table
    // and its edit form can read it without a second request.
    const nationalityByMemberId = new Map(members.map((m) => [m.memberId, m.nationality]));
    const rows = registrations.map((r) => ({
      ...r,
      nationality: r.memberId ? nationalityByMemberId.get(r.memberId) ?? null : null,
    }));

    const stats = {
      total: registrations.length,
      members: registrations.filter(r => r.isMember).length,
      nonMembers: registrations.filter(r => !r.isMember).length,
      totalRegisteredMembers: members.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        registrations: rows,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, memberId, memberType, nationality } = data;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const registration = await prisma.registration.create({
      data: {
        name,
        memberId: memberId || null,
        memberType: memberType || null,
        isMember: !!memberId,
      }
    });

    // Also create in Member table just in case so they can log in next time
    if (memberId) {
      const existingMember = await prisma.member.findUnique({ where: { memberId } });
      if (!existingMember) {
        await prisma.member.create({
          data: {
            memberId,
            name,
            memberType: memberType || 'Gold',
            nationality: nationality || null,
          }
        });
      } else if (nationality) {
        await prisma.member.update({ where: { memberId }, data: { nationality } });
      }
    }

    return NextResponse.json({ success: true, data: registration });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}
