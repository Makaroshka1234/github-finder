import { NextRequest, NextResponse } from 'next/server';
import { clearAllCache } from '@/lib/redis';

export async function DELETE(request: NextRequest) {
  try {
    await clearAllCache();

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Clear cache error:', message);

    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
