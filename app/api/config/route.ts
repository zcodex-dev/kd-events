import { NextResponse } from 'next/server';
import { getAppConfig, updateAppConfig } from '@/lib/uploads/metadata';
import type { ApiResponse, AppConfig } from '@/types';

export async function GET() {
  try {
    const config = await getAppConfig();
    return NextResponse.json<ApiResponse<AppConfig>>(
      { success: true, data: config },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get config error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to retrieve configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.allowedTypes)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid configuration parameters' },
        { status: 400 }
      );
    }

    const currentConfig = await getAppConfig();
    const updated = await updateAppConfig({
      ...currentConfig,
      allowedTypes: body.allowedTypes,
    });

    return NextResponse.json<ApiResponse<AppConfig>>(
      { success: true, data: updated, message: 'Configuration saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Save config error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
