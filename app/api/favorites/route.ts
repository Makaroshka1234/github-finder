import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getCache, setCache, deleteCache } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { source, itemType, externalId, snapshotData } = await req.json();

  if (!source || !itemType || !externalId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_source_itemType_externalId: {
        userId: user.id,
        source: source as 'github' | 'gitlab',
        itemType: itemType as 'repository' | 'user',
        externalId,
      },
    },
    update: { snapshotData },
    create: {
      userId: user.id,
      source: source as 'github' | 'gitlab',
      itemType: itemType as 'repository' | 'user',
      externalId,
      snapshotData,
    },
  });

  // Invalidate favorites cache for this user
  await deleteCache(user.id, 'favorites', 'favorites');

  return NextResponse.json(favorite, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const cached = await getCache<any>(user.id, 'favorites', 'favorites');
  if (cached) {
    return NextResponse.json(cached, { headers: { 'x-cache': 'HIT' } });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  await setCache(user.id, 'favorites', favorites, 300, 'favorites');

  return NextResponse.json(favorites, { headers: { 'x-cache': 'MISS' } });
}
