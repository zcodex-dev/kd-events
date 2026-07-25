import { NextResponse } from 'next/server';
import { getWebPageById, updateWebPage, removeWebPage } from '@/lib/uploads/metadata';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse, WebPage } from '@/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized. Super admin required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existingPage = await getWebPageById(id);
    if (!existingPage) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Web page not found' }, { status: 404 });
    }

    const updatedPage = await updateWebPage(id, body);
    
    if (!updatedPage) {
       return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update web page' }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<WebPage>>({ success: true, data: updatedPage, message: 'Web page updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Update web page error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update web page' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized. Super admin required.' }, { status: 403 });
    }

    const { id } = await params;
    const success = await removeWebPage(id);

    if (!success) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Web page not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({ success: true, message: 'Web page deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete web page error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to delete web page' }, { status: 500 });
  }
}
