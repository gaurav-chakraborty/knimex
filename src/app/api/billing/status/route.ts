import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user, usageRecords } from '@/db/schema';
import { isBillingConfigured, PLAN_LIMITS } from '@/lib/stripe';

export async function GET(_request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [row] = await db
    .select({
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
      stripeCustomerId: user.stripeCustomerId,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const plan = row?.plan ?? 'free';
  const limit = PLAN_LIMITS[plan]?.filesPerDay ?? PLAN_LIMITS.free.filesPerDay;

  const today = new Date().toISOString().slice(0, 10);
  const [usage] = await db
    .select({ filesProcessed: usageRecords.filesProcessed })
    .from(usageRecords)
    .where(and(eq(usageRecords.identifier, `user:${session.user.id}`), eq(usageRecords.usageDate, today)))
    .limit(1);

  const usedToday = usage?.filesProcessed ?? 0;

  return NextResponse.json({
    plan,
    subscriptionStatus: row?.subscriptionStatus ?? 'inactive',
    currentPeriodEnd: row?.currentPeriodEnd ?? null,
    hasStripeCustomer: Boolean(row?.stripeCustomerId),
    billingConfigured: isBillingConfigured(),
    usage: {
      date: today,
      used: usedToday,
      limit,
      remaining: limit === null ? null : Math.max(0, limit - usedToday),
    },
  });
}
