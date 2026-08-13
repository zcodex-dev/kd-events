import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/r2/client';
import { generateUniqueFileName, generateUploadPath } from '@/lib/uploads/file-utils';
import { validateFileSize, MAX_FILE_SIZE } from '@/lib/validation/schemas';
import { getAppConfig } from '@/lib/uploads/metadata';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const formData = await request.formData();
    const { id } = await params;

    // Extract text fields
    const name = formData.get('name') as string;
    const contact = formData.get('contact') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const passportId = formData.get('passportId') as string;
    const memberType = formData.get('memberType') as string;
    const nationality = formData.get('nationality') as string;
    const isBannedStr = formData.get('isBanned') as string;
    const memberId = formData.get('memberId') as string;
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (memberId !== null) updateData.memberId = memberId;
    if (contact !== null) updateData.contact = contact;
    if (phoneNumber !== null) updateData.phoneNumber = phoneNumber;
    if (passportId !== null) updateData.passportId = passportId;
    if (memberType !== null) updateData.memberType = memberType;
    if (isBannedStr !== null) updateData.isBanned = isBannedStr === 'true';

    // Handle avatar upload if present
    const avatarFile = formData.get('avatar') as File | null;
    if (avatarFile && avatarFile.size > 0) {
      const config = await getAppConfig();
      if (!config.allowedTypes.includes(avatarFile.type)) {
        return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
      }
      if (!validateFileSize(avatarFile.size, MAX_FILE_SIZE)) {
        return NextResponse.json({ success: false, error: 'File too large' }, { status: 400 });
      }

      const uploadFolder = process.env.GITHUB_UPLOAD_FOLDER || 'public-uploads';
      const storedName = generateUniqueFileName(avatarFile.name);
      const r2Key = generateUploadPath(uploadFolder, storedName, new Date());
      
      const arrayBuffer = await avatarFile.arrayBuffer();
      await uploadFile(r2Key, Buffer.from(arrayBuffer), avatarFile.type);
      
      let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
        appUrl = `https://${appUrl}`;
      }
      updateData.avatarUrl = `${appUrl}/api/raw/${r2Key}`;
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: updateData,
    });

    // Nationality lives on Member (it's what the registration card reads), so
    // mirror it across when this registration is tied to a member.
    if (updated.memberId && nationality !== null) {
      await prisma.member.updateMany({
        where: { memberId: updated.memberId },
        data: { nationality: nationality || null },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update registration' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    await prisma.registration.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete registration' },
      { status: 500 }
    );
  }
}
