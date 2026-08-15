import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { user } from '@/db/schema';
import { checkAdminAccess } from '@/lib/auth';
import { logAdminAction } from '@/lib/admin-audit';
import { adminUserFields } from '@/lib/admin-user-select';
import { privateJson, updateUserSchema, validationError } from '@/lib/admin-validation';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const adminCheck = await checkAdminAccess();

    if (!adminCheck.isAdmin || !adminCheck.user) {
      return privateJson(
        { error: adminCheck.error || 'Unauthorized', code: adminCheck.user ? 'FORBIDDEN' : 'UNAUTHORIZED' },
        adminCheck.user ? 403 : 401,
      );
    }

    const [target] = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
    if (!target) {
      return privateJson({ error: 'User not found', code: 'NOT_FOUND' }, 404);
    }

    const parsed = updateUserSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);

    if (id === adminCheck.user.id && parsed.data.role && parsed.data.role !== 'admin') {
      return privateJson(
        { error: 'You cannot remove your own admin role', code: 'SELF_DEMOTION_BLOCKED' },
        400,
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return privateJson({ error: 'No valid fields to update', code: 'NO_CHANGES' }, 400);
    }

    const [updated] = await db
      .update(user)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning(adminUserFields);

    if (!updated) {
      return privateJson({ error: 'User could not be updated', code: 'UPDATE_FAILED' }, 409);
    }

    await logAdminAction({
      adminId: adminCheck.user.id,
      action: 'admin_user_updated',
      targetUserId: id,
      details: { changedFields: Object.keys(parsed.data) },
    });

    return privateJson({ user: updated });
  } catch (error) {
    console.error('PATCH admin user error:', error);
    return privateJson({ error: 'User update unavailable', code: 'INTERNAL_SERVER_ERROR' }, 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const adminCheck = await checkAdminAccess();

    if (!adminCheck.isAdmin || !adminCheck.user) {
      return privateJson(
        { error: adminCheck.error || 'Unauthorized', code: adminCheck.user ? 'FORBIDDEN' : 'UNAUTHORIZED' },
        adminCheck.user ? 403 : 401,
      );
    }

    if (id === adminCheck.user.id) {
      return privateJson(
        { error: 'You cannot delete your own account', code: 'SELF_DELETE_BLOCKED' },
        400,
      );
    }

    const [target] = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!target) {
      return privateJson({ error: 'User not found', code: 'NOT_FOUND' }, 404);
    }

    const [deleted] = await db.delete(user).where(eq(user.id, id)).returning({ id: user.id });
    if (!deleted) {
      return privateJson({ error: 'User could not be deleted', code: 'DELETE_FAILED' }, 409);
    }

    await logAdminAction({
      adminId: adminCheck.user.id,
      action: 'admin_user_deleted',
      targetUserId: id,
      details: { email: target.email },
    });

    return privateJson({ success: true });
  } catch (error) {
    console.error('DELETE admin user error:', error);
    return privateJson({ error: 'User deletion unavailable', code: 'INTERNAL_SERVER_ERROR' }, 500);
  }
}
