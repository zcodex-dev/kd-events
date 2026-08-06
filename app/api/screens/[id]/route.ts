import { NextResponse } from 'next/server';
import { getTvScreenById, updateTvScreen, removeTvScreen } from '@/lib/uploads/metadata';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse, TvScreen } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const screen = await getTvScreenById(id);

    if (!screen) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'TV Screen not found' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<TvScreen>>({ success: true, data: screen }, { status: 200 });
  } catch (error: any) {
    console.error('Get TV screen error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch TV screen' }, { status: 500 });
  }
}

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

    const updated = await updateTvScreen(id, body);

    if (!updated) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'TV Screen not found' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<TvScreen>>({ success: true, data: updated, message: 'TV Screen updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Update TV screen error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update TV screen' }, { status: 500 });
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
    const removed = await removeTvScreen(id);

    if (!removed) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'TV Screen not found' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({ success: true, message: 'TV Screen deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete TV screen error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to delete TV screen' }, { status: 500 });
  }
}
