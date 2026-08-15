import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { count, desc, eq, like, or } from 'drizzle-orm';
import { db } from '@/db';
import { user } from '@/db/schema';
import { checkAdminAccess, auth } from '@/lib/auth';
import { logAdminAction } from '@/lib/admin-audit';
import { createUserSchema, privateJson, validationError } from '@/lib/admin-validation';
import { adminUserFields } from '@/lib/admin-user-select';

function parseBoundedInteger(value: string | null, fallback: number, minimum: number, maximum: number) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  return Math.min(Math.max(Number.parseInt(value, 10), minimum), maximum);
}

function sanitizeSearchInput(input: string | null) {
  const trimmed = input?.trim().slice(0, 100) ?? '';
  return trimmed ? trimmed.replace(/[%_\\]/g, '\\$&') : null;
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.isAdmin) {
      return privateJson(
        { error: adminCheck.error || 'Unauthorized', code: adminCheck.user ? 'FORBIDDEN' : 'UNAUTHORIZED' },
        adminCheck.user ? 403 : 401,
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInteger(searchParams.get('limit'), 20, 1, 100);
    const offset = parseBoundedInteger(searchParams.get('offset'), 0, 0, 100_000);
    const search = sanitizeSearchInput(searchParams.get('search'));
    const filter = search
      ? or(like(user.name, `%${search}%`), like(user.email, `%${search}%`))
      : undefined;

    const [totalResult, users] = await Promise.all([
      db.select({ count: count() }).from(user).where(filter),
      db.select(adminUserFields).from(user).where(filter).orderBy(desc(user.createdAt)).limit(limit).offset(offset),
    ]);

    return privateJson({
      users,
      total: totalResult[0]?.count ?? 0,
    });
  } catch (error) {
    console.error('GET users error:', error);
    return privateJson({ error: 'User directory unavailable', code: 'INTERNAL_SERVER_ERROR' }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.isAdmin || !adminCheck.user) {
      return privateJson(
        { error: adminCheck.error || 'Unauthorized', code: adminCheck.user ? 'FORBIDDEN' : 'UNAUTHORIZED' },
        adminCheck.user ? 403 : 401,
      );
    }

    const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);

    const { email, name, role, plan, upsert } = parsed.data;
    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);

    if (existing) {
      if (!upsert) {
        return privateJson({ error: 'A user with this email already exists', code: 'ALREADY_EXISTS' }, 409);
      }

      const [updated] = await db
        .update(user)
        .set({ name, role, plan, updatedAt: new Date() })
        .where(eq(user.id, existing.id))
        .returning(adminUserFields);

      await logAdminAction({
        adminId: adminCheck.user.id,
        action: 'admin_user_upserted',
        targetUserId: existing.id,
        details: { email, role, plan },
      });

      return privateJson({ user: updated, created: false });
    }

    const temporaryPassword = randomBytes(24).toString('base64url');
    let signUpResult: Awaited<ReturnType<typeof auth.api.signUpEmail>>;
    try {
      signUpResult = await auth.api.signUpEmail({ body: { name, email, password: temporaryPassword } });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        return privateJson({ error: 'A user with this email already exists', code: 'ALREADY_EXISTS' }, 409);
      }
      console.error('Admin user signup failed:', error);
      return privateJson({ error: 'User creation failed', code: 'SIGNUP_FAILED' }, 400);
    }

    const newUserId = signUpResult?.user?.id;
    if (!newUserId) {
      return privateJson({ error: 'User creation did not return an id', code: 'SIGNUP_INCOMPLETE' }, 500);
    }

    const [finalUser] = await db
      .update(user)
      .set({ role, plan, updatedAt: new Date() })
      .where(eq(user.id, newUserId))
      .returning(adminUserFields);

    await logAdminAction({
      adminId: adminCheck.user.id,
      action: 'admin_user_created',
      targetUserId: newUserId,
      details: { email, role, plan },
    });

    return privateJson(
      {
        user: finalUser,
        created: true,
        temporaryPassword,
        note: 'Share this temporary password with the user securely. It should be changed after first sign-in.',
      },
      201,
    );
  } catch (error) {
    console.error('POST users error:', error);
    return privateJson({ error: 'User management unavailable', code: 'INTERNAL_SERVER_ERROR' }, 500);
  }
}
