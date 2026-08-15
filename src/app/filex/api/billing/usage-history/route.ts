import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { and, eq, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { usageRecords } from '@/db/schema';

const DAYS = 7;

export async function GET(_request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const identifier = `user:${session.user.id}`;
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - (DAYS - 1));
  const startDateStr = startDate.toISOString().slice(0, 10);

  const rows = await db
    .select({ usageDate: usageRecords.usageDate, filesProcessed: usageRecords.filesProcessed })
    .from(usageRecords)
    .where(and(eq(usageRecords.identifier, identifier), gte(usageRecords.usageDate, startDateStr)));

  const byDate = new Map(rows.map((row) => [row.usageDate, row.filesProcessed]));

  const history = Array.from({ length: DAYS }, (_, i) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (DAYS - 1 - i));
    const dateStr = date.toISOString().slice(0, 10);
    return { date: dateStr, filesProcessed: byDate.get(dateStr) ?? 0 };
  });

  return NextResponse.json({ history });
}
