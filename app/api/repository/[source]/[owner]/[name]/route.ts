import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/redis';
import { loadRepositoryDetail, isValidSource } from '@/app/lib/detailData';

const RATE_LIMIT = 60;
const RATE_WINDOW_SECONDS = 60;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ source: string; owner: string; name: string }> }
) {
  try {
    const { source, owner, name } = await params;

    if (!isValidSource(source)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const rate = await checkRateLimit(`repo:${ip}`, RATE_LIMIT, RATE_WINDOW_SECONDS);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(RATE_WINDOW_SECONDS) } }
      );
    }

    const { data, cached } = await loadRepositoryDetail(source, owner, name);

    return NextResponse.json(data, {
      headers: { 'x-cache': cached ? 'HIT' : 'MISS' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Repository detail error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
