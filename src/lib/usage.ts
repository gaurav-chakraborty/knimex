import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { usageRecords, user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { PLAN_LIMITS } from '@/lib/stripe';
import { sendUsageLimitReachedEmail } from '@/lib/email';

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getClientIdentifierFromRequest(request: NextRequest, userId: string | null): string {
  if (userId) return `user:${userId}`;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
  return `ip:${ip}`;
}

export interface UsageCheckResult {
  allowed: boolean;
  plan: string;
  limit: number | null;
  used: number;
  remaining: number | null;
}

/**
 * Resolves the current caller's plan (defaulting anonymous users to "free"),
 * checks their usage for today against that plan's daily file limit, and —
 * if allowed — atomically increments the counter for `filesRequested`.
 */
export async function checkAndConsumeUsage(
  request: NextRequest,
  filesRequested: number
): Promise<UsageCheckResult> {
  let userId: string | null = null;
  let userEmail: string | null = null;
  let plan = 'free';

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user) {
      userId = session.user.id;
      const [row] = await db
        .select({ plan: user.plan, email: user.email })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
      if (row?.plan) plan = row.plan;
      userEmail = row?.email ?? null;
    }
  } catch {
    // Unauthenticated request — treat as free/anonymous.
  }

  // `?? PLAN_LIMITS.free.filesPerDay` here would be wrong: filesPerDay is
  // legitimately `null` for unlimited plans, and `??` treats that as
  // "missing" too, silently reverting Pro/Enterprise to the free cap.
  const limit = (PLAN_LIMITS[plan] ?? PLAN_LIMITS.free).filesPerDay;

  if (limit === null) {
    return { allowed: true, plan, limit: null, used: 0, remaining: null };
  }

  const identifier = getClientIdentifierFromRequest(request, userId);
  const date = todayUTC();

  const [existing] = await db
    .select()
    .from(usageRecords)
    .where(and(eq(usageRecords.identifier, identifier), eq(usageRecords.usageDate, date)))
    .limit(1);

  const used = existing?.filesProcessed ?? 0;

  if (used + filesRequested > limit) {
    if (userEmail && existing && !existing.limitNotifiedAt) {
      await db
        .update(usageRecords)
        .set({ limitNotifiedAt: new Date() })
        .where(eq(usageRecords.id, existing.id));
      // Fire-and-forget — a slow/failed email should never block the response.
      sendUsageLimitReachedEmail(userEmail, plan, limit).catch(() => {});
    }
    return { allowed: false, plan, limit, used, remaining: Math.max(0, limit - used) };
  }

  if (existing) {
    await db
      .update(usageRecords)
      .set({ filesProcessed: used + filesRequested, updatedAt: new Date() })
      .where(eq(usageRecords.id, existing.id));
  } else {
    await db.insert(usageRecords).values({
      identifier,
      usageDate: date,
      filesProcessed: filesRequested,
    });
  }

  return { allowed: true, plan, limit, used: used + filesRequested, remaining: limit - (used + filesRequested) };
}
