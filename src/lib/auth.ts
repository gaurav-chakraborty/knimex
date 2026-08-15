import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

const isProduction = process.env.NODE_ENV === 'production';
const authSecret = process.env.BETTER_AUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
const authBaseUrl = process.env.BETTER_AUTH_URL?.trim();

if (isProduction && !authSecret) {
  throw new Error('BETTER_AUTH_SECRET is required in production.');
}

if (isProduction && !authBaseUrl) {
  throw new Error('BETTER_AUTH_URL is required in production.');
}

const localAuthSecret = 'filex-local-development-secret-change-me';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  baseURL: authBaseUrl || 'http://localhost:3000',
  secret: authSecret || localAuthSecret,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [bearer()],
});

export type AdminAccessResult = {
  isAdmin: boolean;
  user: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['user'] | null;
  error?: string;
};

// Session validation helper. Prefer the request headers when available so the
// helper remains correct for middleware, tests, and non-default hostnames.
export async function getCurrentUser(request?: NextRequest) {
  const session = await auth.api.getSession({
    headers: request?.headers ?? (await headers()),
  });
  return session?.user || null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const [currentUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return currentUser?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Check admin access from the current request headers. This performs one
// session lookup and one minimal role lookup; a missing user row fails closed.
export async function checkAdminAccess(): Promise<AdminAccessResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { isAdmin: false, user: null, error: 'Unauthorized' };
    }

    const [record] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!record) {
      return { isAdmin: false, user: session.user, error: 'User record not found' };
    }

    if (record.role !== 'admin') {
      return { isAdmin: false, user: session.user, error: 'Forbidden - Admin access required' };
    }

    return { isAdmin: true, user: session.user };
  } catch (error) {
    console.error('Error in checkAdminAccess:', error);
    return { isAdmin: false, user: null, error: 'Internal server error' };
  }
}
