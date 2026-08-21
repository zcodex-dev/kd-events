import { NextResponse } from 'next/server';
import { getAllFolders, addFolder, getAllFiles } from '@/lib/uploads/metadata';
import { getSession } from '@/lib/auth/session';
import type { ApiResponse, FolderConfig } from '@/types';

export async function GET() {
  try {
    const folders = await getAllFolders();
    const files = await getAllFiles();
    
    // Extract unique folder names from files that don't exist in explicit folders
    const explicitFolderNames = new Set(folders.map(f => f.name.toLowerCase()));
    const fileFolders = new Set(files.map(f => f.folder).filter(Boolean) as string[]);
    
    const combinedFolders = [...folders];
    for (const ff of fileFolders) {
      if (!explicitFolderNames.has(ff.toLowerCase())) {
        combinedFolders.push({
          name: ff,
          createdAt: new Date().toISOString()
        });
        explicitFolderNames.add(ff.toLowerCase());
      }
    }
    
    return NextResponse.json<ApiResponse<FolderConfig[]>>({ success: true, data: combinedFolders }, { status: 200 });
  } catch (error) {
    console.error('Failed to get folders:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to retrieve folders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.permissions.canUpload) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Folder name is required' }, { status: 400 });
    }

    const folders = await getAllFolders();
    if (folders.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Folder already exists' }, { status: 400 });
    }

    const newFolder: FolderConfig = {
      name: name.trim(),
      color: color || undefined,
      createdAt: new Date().toISOString()
    };

    await addFolder(newFolder);

    return NextResponse.json<ApiResponse<FolderConfig>>({ success: true, data: newFolder }, { status: 201 });
  } catch (error) {
    console.error('Failed to create folder:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create folder' }, { status: 500 });
  }
}
