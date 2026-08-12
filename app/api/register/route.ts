import { NextResponse } from 'next/server';
import { checkMemberStatus, recordRegistration } from '@/lib/google-sheets';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contact } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    // 1. Check if the user is a member
    const status = await checkMemberStatus(name);

    if (status.error) {
      console.error('Google Sheets Error:', status.error);
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // 2. Record the registration
    const recorded = await recordRegistration({
      name,
      contact: contact || '',
      isMember: status.isMember,
      memberId: status.memberId
    });

    if (!recorded) {
      return NextResponse.json({ success: false, error: 'Failed to record registration' }, { status: 500 });
    }

    // 3. Return response based on member status
    return NextResponse.json({
      success: true,
      isMember: status.isMember,
      memberId: status.memberId,
      message: status.isMember ? `Welcome back, Member ${status.memberId}!` : 'Registration recorded successfully.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process registration' }, { status: 500 });
  }
}
