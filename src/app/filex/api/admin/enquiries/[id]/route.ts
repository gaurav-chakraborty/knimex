import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { enquiries } from '@/db/schema';
import { checkAdminAccess } from '@/lib/auth';
import { updateEnquirySchema } from '@/lib/public-submissions';
import { privateJson, validationError } from '@/lib/admin-validation';

function parseId(value: string) {
  const id = Number.parseInt(value, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.isAdmin) {
      return privateJson({ error: adminCheck.error || 'Unauthorized', code: adminCheck.user ? 'FORBIDDEN' : 'UNAUTHORIZED' }, adminCheck.user ? 403 : 401);
    }

    const id = parseId((await params).id);
    if (!id) return privateJson({ error: 'Invalid enquiry id', code: 'INVALID_ID' }, 400);
    const parsed = updateEnquirySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);

    const [updated] = await db.update(enquiries)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(enquiries.id, id))
      .returning();

    if (!updated) return privateJson({ error: 'Enquiry not found', code: 'NOT_FOUND' }, 404);
    return privateJson({ enquiry: updated });
  } catch (error) {
    console.error('PATCH admin enquiry error:', error);
    return privateJson({ error: 'Enquiry update unavailable', code: 'INTERNAL_SERVER_ERROR' }, 500);
  }
}
