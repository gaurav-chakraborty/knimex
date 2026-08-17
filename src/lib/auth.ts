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
const localAuthSecret = 'filex-local-development-secret-change-me';
const authBaseUrl = process.env.BETTER_AUTH_URL?.trim()
  || process.env.NEXT_PUBLIC_SITE_URL?.trim()
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
  || 'http://localhost:3000';

if (isProduction && !authSecret) {
  console.warn('BETTER_AUTH_SECRET is missing in production. Using fallback secret so builds can complete; set the real secret in Vercel before relying on authenticated routes.');
}

if (isProduction && !process.env.BETTER_AUTH_URL?.trim()) {
  console.warn(`BETTER_AUTH_URL is missing in production. Falling back to ${authBaseUrl}.`);
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  baseURL: authBaseUrl,
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
