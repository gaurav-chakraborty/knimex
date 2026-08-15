import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { db } from '@/db';
import { user } from '@/db/schema';
import { getStripe, isBillingConfigured } from '@/lib/stripe';
import { sendUpgradeConfirmationEmail, sendSubscriptionCanceledEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  if (!isBillingConfigured()) {
    return NextResponse.json({ error: 'Billing is not configured' }, { status: 503 });
  }

  const stripe = getStripe()!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.metadata?.userId;
        const plan = checkoutSession.metadata?.plan || 'pro';
        const subscriptionId =
          typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : checkoutSession.subscription?.id;

        if (userId) {
          await db
            .update(user)
            .set({
              plan,
              subscriptionStatus: 'active',
              stripeSubscriptionId: subscriptionId ?? null,
              updatedAt: new Date(),
            })
            .where(eq(user.id, userId));

          const [row] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId)).limit(1);
          if (row?.email) {
            sendUpgradeConfirmationEmail(row.email, plan).catch(() => {});
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        const isActive = ['active', 'trialing'].includes(subscription.status);
        const plan = isActive ? subscription.metadata?.plan || 'pro' : 'free';

        await db
          .update(user)
          .set({
            plan,
            subscriptionStatus: subscription.status,
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
            updatedAt: new Date(),
          })
          .where(eq(user.id, userId));

        if (event.type === 'customer.subscription.deleted' || !isActive) {
          const [row] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId)).limit(1);
          if (row?.email) {
            sendSubscriptionCanceledEmail(row.email).catch(() => {});
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error('Error processing Stripe webhook event:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
