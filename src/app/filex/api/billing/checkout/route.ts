import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/schema';
import { getStripe, isBillingConfigured, PLAN_PRICE_IDS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  if (!isBillingConfigured()) {
    return NextResponse.json(
      { error: 'Billing is not configured yet. Set STRIPE_SECRET_KEY to enable checkout.' },
      { status: 503 }
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const plan = body.plan === 'enterprise' ? 'enterprise' : 'pro';
  const priceId = PLAN_PRICE_IDS[plan];

  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for the "${plan}" plan.` },
      { status: 503 }
    );
  }

  const stripe = getStripe()!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const [row] = await db
    .select({ stripeCustomerId: user.stripeCustomerId, email: user.email })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  let customerId = row?.stripeCustomerId ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: row?.email ?? session.user.email,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await db
      .update(user)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/account?checkout=success`,
    cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
    metadata: { userId: session.user.id, plan },
    subscription_data: {
      metadata: { userId: session.user.id, plan },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
