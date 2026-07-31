import Stripe from 'stripe';

let stripeClient: Stripe | null = null;
let attempted = false;

/**
 * Lazily instantiates the Stripe client. Returns null when STRIPE_SECRET_KEY
 * isn't configured so billing routes can degrade gracefully in dev/test
 * environments instead of crashing the build.
 */
export function getStripe(): Stripe | null {
  if (attempted) return stripeClient;
  attempted = true;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
  });

  return stripeClient;
}

export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_ID_PRO,
  enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE,
};

export const PLAN_LIMITS: Record<string, { filesPerDay: number | null }> = {
  free: { filesPerDay: 5 },
  pro: { filesPerDay: null },
  enterprise: { filesPerDay: null },
};
