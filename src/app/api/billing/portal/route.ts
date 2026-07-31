import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/schema';
import { getStripe, isBillingConfigured } from '@/lib/stripe';

export async function POST(_request: NextRequest) {
  if (!isBillingConfigured()) {
    return NextResponse.json(
      { error: 'Billing is not configured yet. Set STRIPE_SECRET_KEY to enable the billing portal.' },
      { status: 503 }
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [row] = await db
    .select({ stripeCustomerId: user.stripeCustomerId })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!row?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No billing account found. Subscribe to a paid plan first.' },
      { status: 404 }
    );
  }

  const stripe = getStripe()!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${siteUrl}/account`,
  });

  return NextResponse.json({ url: portalSession.url });
}
