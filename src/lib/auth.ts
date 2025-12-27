import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true
	},
	plugins: [bearer()]
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}

// Admin authorization helper
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const [currentUser] = await db.select({ role: user.role })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return currentUser?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Check admin from headers
export async function checkAdminAccess(): Promise<{ isAdmin: boolean; user: any | null; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || !session.user) {
      return { isAdmin: false, user: null, error: 'Unauthorized' };
    }

    const adminStatus = await isAdmin(session.user.id);

    if (!adminStatus) {
      return { isAdmin: false, user: session.user, error: 'Forbidden - Admin access required' };
    }

    return { isAdmin: true, user: session.user };
  } catch (error) {
    console.error('Error in checkAdminAccess:', error);
    return { isAdmin: false, user: null, error: 'Internal server error' };
  }
}
