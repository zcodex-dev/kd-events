import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/r2/client';
import { generateUniqueFileName, generateUploadPath } from '@/lib/uploads/file-utils';
import { validateFileSize, MAX_FILE_SIZE } from '@/lib/validation/schemas';
import { getAppConfig } from '@/lib/uploads/metadata';
import { sendTelegramAlert } from '@/lib/notifications/telegram';
import { isEmail, sendConfirmationEmail } from '@/lib/notifications/email';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const contact = formData.get('contact') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const passportId = formData.get('passportId') as string;
    const memberId = formData.get('memberId') as string;
    const isNonMemberTab = formData.get('isNonMemberTab') === 'true';
    const eventId = (formData.get('eventId') as string) || null;
    const eventTitle = (formData.get('eventTitle') as string) || null;

    let status = { isMember: false, memberData: null as any, error: null };
    let finalName = name;
    let finalMemberId: string | null = memberId;

    if (!isNonMemberTab) {
      if (!memberId || memberId.trim() === '') {
        return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
      }

      const member = await prisma.member.findUnique({
        where: { memberId: memberId.trim() }
      });

      if (!member) {
        return NextResponse.json({ 
          success: false, 
          error: 'Member ID not found. Please check your spelling or register as a Non-Member.' 
        }, { status: 404 });
      }

      status.isMember = true;
      status.memberData = member;
      finalName = member.name;
      finalMemberId = member.memberId;

      // Pressing "Register Event" twice for the same event shouldn't stack rows.
      if (eventId) {
        const existing = await prisma.registration.findFirst({
          where: { memberId: member.memberId, eventId },
          select: { id: true },
        });

        if (existing) {
          return NextResponse.json({
            success: true,
            alreadyRegistered: true,
            isMember: true,
            memberData: member,
            message: `You are already registered for ${eventTitle || 'this event'}.`,
          });
        }
      }
    } else {
      if (!name || name.trim() === '') {
        return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
      }
    }

    let passportImageUrl = null;
    const passportFile = formData.get('passportImage') as File | null;
    
    if (passportFile && passportFile.size > 0) {
      const config = await getAppConfig();
      if (!config.allowedTypes.includes(passportFile.type)) {
        return NextResponse.json({ success: false, error: 'Invalid passport image type' }, { status: 400 });
      }
      if (!validateFileSize(passportFile.size, MAX_FILE_SIZE)) {
        return NextResponse.json({ success: false, error: 'Passport image too large' }, { status: 400 });
      }

      const uploadFolder = process.env.GITHUB_UPLOAD_FOLDER || 'public-uploads';
      const storedName = generateUniqueFileName(passportFile.name);
      const r2Key = generateUploadPath(uploadFolder, storedName, new Date());
      
      const arrayBuffer = await passportFile.arrayBuffer();
      await uploadFile(r2Key, Buffer.from(arrayBuffer), passportFile.type);
      
      let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
        appUrl = `https://${appUrl}`;
      }
      passportImageUrl = `${appUrl}/api/raw?key=${encodeURIComponent(r2Key)}`;
    }

    let prevReg = null;
    if (status.isMember) {
      prevReg = await prisma.registration.findFirst({
        where: { memberId: finalMemberId },
        orderBy: { createdAt: 'desc' }
      });
    }

    let finalAvatarUrl = null;
    if (passportImageUrl) {
      finalAvatarUrl = passportImageUrl;
    } else if (prevReg && prevReg.avatarUrl) {
      finalAvatarUrl = prevReg.avatarUrl;
    } else {
      finalAvatarUrl = '/assets/profiles/placeholder.svg';
    }

    if (!status.isMember) {
      // Receptionist manually assigns member IDs later, so we do not auto-generate a Member record here.
      finalMemberId = null;
    }

    let registration;

    // If they already have an empty registration (no event) and they are registering for an event now,
    // we just update that empty registration instead of creating a duplicate on the table.
    if (status.isMember && eventId) {
      const emptyRegistration = await prisma.registration.findFirst({
        where: { memberId: finalMemberId, eventId: null }
      });

      if (emptyRegistration) {
        registration = await prisma.registration.update({
          where: { id: emptyRegistration.id },
          data: {
            eventId,
            eventTitle,
            updatedAt: new Date()
          }
        });
      }
    }

    // Otherwise, create a new registration and carry over their details from previous registration
    if (!registration) {
      registration = await prisma.registration.create({
        data: {
          name: finalName,
          contact: contact || (prevReg?.contact) || null,
          phoneNumber: phoneNumber || (prevReg?.phoneNumber) || null,
          passportId: passportId || (prevReg?.passportId) || null,
          passportImageUrl: passportImageUrl || (prevReg?.passportImageUrl) || null,
          isMember: status.isMember,
          memberId: finalMemberId || null,
          memberType: status.isMember ? status.memberData?.memberType : 'Silver',
          avatarUrl: finalAvatarUrl,
          eventId,
          eventTitle,
        }
      });
    }

    if (!registration) {
      return NextResponse.json({ success: false, error: 'Failed to record registration' }, { status: 500 });
    }

    // Fire notifications and wait for them to ensure they complete before response ends
    const statusText = status.isMember ? 'Existing Member' : 'New Non-Member';
    const contactInfo = contact || phoneNumber || 'N/A';
    const alertMessage = `🔔 *New Event Enrollment*\n\n*Event:* ${eventTitle || 'General Registration'}\n*Name:* ${finalName}\n*Status:* ${statusText}\n*Contact Info:* ${contactInfo}`;
    await sendTelegramAlert(alertMessage);

    // If contact or phoneNumber is an email, send confirmation email
    const emailAddress = (contact && isEmail(contact)) ? contact : (phoneNumber && isEmail(phoneNumber)) ? phoneNumber : null;
    if (emailAddress) {
      let eventImageUrl = 'https://i.imgur.com/ykQuk5a.jpeg'; // default
      if (eventId) {
        const eventRecord = await prisma.event.findUnique({ where: { id: eventId } });
        if (eventRecord) {
          eventImageUrl = eventRecord.imageUrl || (eventRecord.images && eventRecord.images[0]) || eventImageUrl;
        }
      }
      await sendConfirmationEmail(emailAddress, eventTitle || 'Kompong Dewa Integrated Resort Event', finalName, eventImageUrl);
    }

    return NextResponse.json({
      success: true,
      isMember: status.isMember,
      memberData: status.memberData,
      memberId: finalMemberId,
      registration: { eventId: registration.eventId, eventTitle: registration.eventTitle, createdAt: registration.createdAt },
      message: status.isMember
        ? `You're registered${eventTitle ? ` for ${eventTitle}` : ''}, ${finalName}!`
        : 'Registration recorded successfully.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: `Failed to process registration: ${error.message || String(error)}` }, { status: 500 });
  }
}
