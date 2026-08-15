import { NextRequest } from 'next/server';
import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { enquiries } from '@/db/schema';
import { checkAdminAccess } from '@/lib/auth';
import { enquiryStatusSchema, enquiryTypeSchema } from '@/lib/public-submissions';
import { privateJson } from '@/lib/admin-validation';

function parseBoundedInteger(value: string | null, fallback: number, minimum: number, maximum: number) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  return Math.min(Math.max(Number.parseInt(value, 10), minimum), maximum);
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.isAdmin) {
      return privateJson({ error: adminCheck.error || 'Unauthorized', code: adminCheck.user ? 'FORBIDDEN' : 'UNAUTHORIZED' }, adminCheck.user ? 403 : 401);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInteger(searchParams.get('limit'), 50, 1, 200);
    const offset = parseBoundedInteger(searchParams.get('offset'), 0, 0, 100_000);
    const status = enquiryStatusSchema.safeParse(searchParams.get('status')).success ? searchParams.get('status') as typeof enquiries.$inferSelect.status : null;
    const type = enquiryTypeSchema.safeParse(searchParams.get('type')).success ? searchParams.get('type') as typeof enquiries.$inferSelect.type : null;
    const conditions = [status ? eq(enquiries.status, status) : undefined, type ? eq(enquiries.type, type) : undefined].filter(Boolean);
    const filter = conditions.length ? and(...conditions) : undefined;

    const [totalResult, records] = await Promise.all([
      db.select({ count: count() }).from(enquiries).where(filter),
      db.select().from(enquiries).where(filter).orderBy(desc(enquiries.createdAt)).limit(limit).offset(offset),
    ]);

    return privateJson({ enquiries: records, total: totalResult[0]?.count ?? 0 });
  } catch (error) {
    console.error('GET admin enquiries error:', error);
    return privateJson({ error: 'Enquiry directory unavailable', code: 'INTERNAL_SERVER_ERROR' }, 500);
  }
}
