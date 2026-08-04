import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { db } from '@/db';
import { user } from '@/db/schema';
import { like, or, desc, count, eq } from 'drizzle-orm';
import { checkAdminAccess, auth } from '@/lib/auth';
import { logAdminAction } from '@/lib/admin-audit';

const VALID_ROLES = ['user', 'admin'];
const VALID_PLANS = ['free', 'pro', 'enterprise'];

// Input sanitization helper
function sanitizeSearchInput(input: string | null): string | null {
  if (!input) return null;

  // Trim and limit length to prevent abuse
  const trimmed = input.trim().slice(0, 100);

  // Remove special SQL characters that could cause issues
  const sanitized = trimmed.replace(/[%_\\]/g, '\\$&');

  return sanitized || null;
}

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess();

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error || 'Unauthorized', code: adminCheck.user ? 'FORBIDDEN' : 'UNAUTHORIZED' },
        { status: adminCheck.user ? 403 : 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const rawSearch = searchParams.get('search');

    // Sanitize search input
    const search = sanitizeSearchInput(rawSearch);

    // Build search filter
    const filter = search ? or(
      like(user.name, `%${search}%`),
      like(user.email, `%${search}%`)
    ) : undefined;

    // Get total count
    const totalResult = await db.select({ count: count() })
      .from(user)
      .where(filter);
    const total = totalResult[0].count;

    // Execute query with pagination and ordering
    const users = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }).from(user)
      .where(filter)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      users,
      total,
    }, { status: 200 });

  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

/**
 * Create a user, or — when `upsert` is true (the default) and a user with
 * that email already exists — update its name/role/plan instead of
 * failing. New accounts are created through better-auth's own sign-up
 * endpoint so the password is hashed the same way a real signup would be;
 * we generate a random temporary password and return it once so the admin
 * can hand it off, rather than inventing our own credential storage.
 */
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess();

    if (!adminCheck.isAdmin || !adminCheck.user) {
      return NextResponse.json(
        { error: adminCheck.error || 'Unauthorized', code: adminCheck.user ? 'FORBIDDEN' : 'UNAUTHORIZED' },
        { status: adminCheck.user ? 403 : 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const role = VALID_ROLES.includes(body.role) ? body.role : 'user';
    const plan = VALID_PLANS.includes(body.plan) ? body.plan : 'free';
    const upsert = body.upsert !== false;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required', code: 'INVALID_EMAIL' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Name is required', code: 'MISSING_NAME' }, { status: 400 });
    }

    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);

    if (existing) {
      if (!upsert) {
        return NextResponse.json(
          { error: 'A user with this email already exists', code: 'ALREADY_EXISTS' },
          { status: 409 }
        );
      }

      const [updated] = await db
        .update(user)
        .set({ name, role, plan, updatedAt: new Date() })
        .where(eq(user.id, existing.id))
        .returning();

      await logAdminAction({
        adminId: adminCheck.user.id,
        action: 'admin_user_upserted',
        targetUserId: existing.id,
        details: { email, role, plan },
      });

      return NextResponse.json({ user: updated, created: false }, { status: 200 });
    }

    const temporaryPassword = randomBytes(18).toString('base64url');
    let signUpResult;
    try {
      signUpResult = await auth.api.signUpEmail({ body: { name, email, password: temporaryPassword } });
    } catch (err) {
      return NextResponse.json(
        { error: 'Failed to create user: ' + (err instanceof Error ? err.message : String(err)), code: 'SIGNUP_FAILED' },
        { status: 400 }
      );
    }

    const newUserId = signUpResult?.user?.id;
    if (!newUserId) {
      return NextResponse.json({ error: 'User creation did not return an id', code: 'SIGNUP_INCOMPLETE' }, { status: 500 });
    }

    // signUpEmail always creates a plain user/free-plan row — apply the
    // admin-specified role/plan on top of it.
    const [finalUser] = await db
      .update(user)
      .set({ role, plan, updatedAt: new Date() })
      .where(eq(user.id, newUserId))
      .returning();

    await logAdminAction({
      adminId: adminCheck.user.id,
      action: 'admin_user_created',
      targetUserId: newUserId,
      details: { email, role, plan },
    });

    return NextResponse.json(
      {
        user: finalUser,
        created: true,
        temporaryPassword,
        note: 'Share this temporary password with the user securely — they should change it after signing in.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST users error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}