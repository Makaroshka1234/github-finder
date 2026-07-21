import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { deleteCache } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function DELETE(
  _: unknown,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const favorite = await prisma.favorite.findUnique({
    where: { id },
  });

  if (!favorite) {
    return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
  }

  if (favorite.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.favorite.delete({
    where: { id },
  });

  // Invalidate favorites cache for this user
  await deleteCache(user.id, 'favorites', 'favorites');

  return NextResponse.json({ success: true });
}
