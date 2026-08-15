import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { jobApplications } from '@/db/schema';
import { checkAdminAccess } from '@/lib/auth';
import { updateJobApplicationSchema } from '@/lib/public-submissions';
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
    if (!id) return privateJson({ error: 'Invalid application id', code: 'INVALID_ID' }, 400);
    const parsed = updateJobApplicationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);

    const [updated] = await db.update(jobApplications)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(jobApplications.id, id))
      .returning();

    if (!updated) return privateJson({ error: 'Job application not found', code: 'NOT_FOUND' }, 404);
    return privateJson({ application: updated });
  } catch (error) {
    console.error('PATCH admin job application error:', error);
    return privateJson({ error: 'Job application update unavailable', code: 'INTERNAL_SERVER_ERROR' }, 500);
  }
}
