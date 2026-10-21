import { NextRequest, NextResponse } from 'next/server';
import { getStaffMember, generateVCard } from '@/lib/staff-data';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const staff = getStaffMember(id);

    if (!staff) {
      return new NextResponse('Staff member not found', { status: 404 });
    }

    const vCardContent = generateVCard(staff);
    const filename = `${staff.firstName}_${staff.lastName}.vcf`.replace(/\s+/g, '_');

    return new NextResponse(vCardContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message || 'Error generating contact card', {
      status: 500,
    });
  }
}
