import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { user } from '@/db/schema';
import { checkAdminAccess } from '@/lib/auth';
import { logAdminAction } from '@/lib/admin-audit';

const VALID_ROLES = ['user', 'admin'];
const VALID_PLANS = ['free', 'pro', 'enterprise'];
const VALID_SUBSCRIPTION_STATUSES = ['inactive', 'active', 'trialing', 'past_due', 'canceled', 'unpaid'];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const adminCheck = await checkAdminAccess();

    if (!adminCheck.isAdmin || !adminCheck.user) {
      return NextResponse.json(
        { error: adminCheck.error || 'Unauthorized', code: adminCheck.user ? 'FORBIDDEN' : 'UNAUTHORIZED' },
        { status: adminCheck.user ? 403 : 401 }
      );
    }

    const [target] = await db.select().from(user).where(eq(user.id, id)).limit(1);
    if (!target) {
      return NextResponse.json({ error: 'User not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: Partial<typeof user.$inferInsert> = {};

    if (body.role !== undefined) {
      if (!VALID_ROLES.includes(body.role)) {
        return NextResponse.json({ error: `role must be one of: ${VALID_ROLES.join(', ')}`, code: 'INVALID_ROLE' }, { status: 400 });
      }
      // Guardrail: an admin can't strip their own admin role — prevents
      // accidentally locking themselves out of the admin panel.
      if (id === adminCheck.user.id && body.role !== 'admin') {
        return NextResponse.json(
          { error: 'You cannot remove your own admin role', code: 'SELF_DEMOTION_BLOCKED' },
          { status: 400 }
        );
      }
      updates.role = body.role;
    }

    if (body.plan !== undefined) {
      if (!VALID_PLANS.includes(body.plan)) {
        return NextResponse.json({ error: `plan must be one of: ${VALID_PLANS.join(', ')}`, code: 'INVALID_PLAN' }, { status: 400 });
      }
      updates.plan = body.plan;
    }

    if (body.subscriptionStatus !== undefined) {
      if (!VALID_SUBSCRIPTION_STATUSES.includes(body.subscriptionStatus)) {
        return NextResponse.json(
          { error: `subscriptionStatus must be one of: ${VALID_SUBSCRIPTION_STATUSES.join(', ')}`, code: 'INVALID_SUBSCRIPTION_STATUS' },
          { status: 400 }
        );
      }
      updates.subscriptionStatus = body.subscriptionStatus;
    }

    if (body.emailVerified !== undefined) {
      updates.emailVerified = Boolean(body.emailVerified);
    }

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ error: 'name cannot be empty', code: 'INVALID_NAME' }, { status: 400 });
      }
      updates.name = name;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update', code: 'NO_CHANGES' }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const [updated] = await db.update(user).set(updates).where(eq(user.id, id)).returning();

    await logAdminAction({
      adminId: adminCheck.user.id,
      action: 'admin_user_updated',
      targetUserId: id,
      details: { changes: updates },
    });

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    console.error('PATCH admin user error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const adminCheck = await checkAdminAccess();

    if (!adminCheck.isAdmin || !adminCheck.user) {
      return NextResponse.json(
        { error: adminCheck.error || 'Unauthorized', code: adminCheck.user ? 'FORBIDDEN' : 'UNAUTHORIZED' },
        { status: adminCheck.user ? 403 : 401 }
      );
    }

    // Guardrail: never let an admin delete their own account through this
    // panel — that's how you end up with zero admins and a locked system.
    if (id === adminCheck.user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account', code: 'SELF_DELETE_BLOCKED' },
        { status: 400 }
      );
    }

    const [target] = await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.id, id)).limit(1);
    if (!target) {
      return NextResponse.json({ error: 'User not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    // Sessions/accounts cascade via the FK's onDelete: "cascade"; feedback
    // and analytics rows fall back to userId: null (onDelete: "set null").
    await db.delete(user).where(eq(user.id, id));

    await logAdminAction({
      adminId: adminCheck.user.id,
      action: 'admin_user_deleted',
      targetUserId: id,
      details: { email: target.email },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE admin user error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
