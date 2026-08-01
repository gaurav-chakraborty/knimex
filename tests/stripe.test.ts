import { describe, expect, it } from 'vitest';
import { PLAN_LIMITS, isBillingConfigured } from '@/lib/stripe';

describe('PLAN_LIMITS', () => {
  it('caps the free plan at 5 files/day', () => {
    expect(PLAN_LIMITS.free.filesPerDay).toBe(5);
  });

  it('leaves pro and enterprise unlimited (null)', () => {
    expect(PLAN_LIMITS.pro.filesPerDay).toBeNull();
    expect(PLAN_LIMITS.enterprise.filesPerDay).toBeNull();
  });
});

describe('isBillingConfigured', () => {
  it('is false when STRIPE_SECRET_KEY is unset', () => {
    const original = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    expect(isBillingConfigured()).toBe(false);
    if (original) process.env.STRIPE_SECRET_KEY = original;
  });

  it('is true once STRIPE_SECRET_KEY is set', () => {
    const original = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    expect(isBillingConfigured()).toBe(true);
    if (original) {
      process.env.STRIPE_SECRET_KEY = original;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
  });
});
