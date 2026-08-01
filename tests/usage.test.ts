import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  selectQueue: [] as any[][],
  updateSetCalls: [] as any[],
  insertCalls: [] as any[],
  sessionUser: null as null | { id: string },
}));

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => state.selectQueue.shift() ?? [],
        }),
      }),
    }),
    update: () => ({
      set: (vals: any) => {
        state.updateSetCalls.push(vals);
        return { where: async () => {} };
      },
    }),
    insert: () => ({
      values: async (vals: any) => {
        state.insertCalls.push(vals);
      },
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  usageRecords: { id: 'id', identifier: 'identifier', usageDate: 'usage_date' },
  user: { id: 'id', plan: 'plan', email: 'email' },
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => (state.sessionUser ? { user: state.sessionUser } : null),
    },
  },
}));

const sendUsageLimitReachedEmail = vi.fn(async (_to: string, _plan: string, _limit: number) => {});
vi.mock('@/lib/email', () => ({
  sendUsageLimitReachedEmail: (to: string, plan: string, limit: number) =>
    sendUsageLimitReachedEmail(to, plan, limit),
}));

import { checkAndConsumeUsage, getClientIdentifierFromRequest } from '@/lib/usage';

function fakeRequest(headers: Record<string, string> = {}): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest;
}

beforeEach(() => {
  state.selectQueue = [];
  state.updateSetCalls = [];
  state.insertCalls = [];
  state.sessionUser = null;
  sendUsageLimitReachedEmail.mockClear();
});

describe('getClientIdentifierFromRequest', () => {
  it('prefixes with user: when a userId is present', () => {
    expect(getClientIdentifierFromRequest(fakeRequest(), 'u1')).toBe('user:u1');
  });

  it('falls back to the first forwarded IP for anonymous callers', () => {
    const req = fakeRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIdentifierFromRequest(req, null)).toBe('ip:1.2.3.4');
  });

  it('falls back to "anonymous" with no IP header', () => {
    expect(getClientIdentifierFromRequest(fakeRequest(), null)).toBe('ip:anonymous');
  });
});

describe('checkAndConsumeUsage', () => {
  it('allows an anonymous request under the free daily limit and creates a record', async () => {
    state.selectQueue = [[]]; // no existing usage_records row for today
    const result = await checkAndConsumeUsage(fakeRequest(), 2);

    expect(result).toEqual({ allowed: true, plan: 'free', limit: 5, used: 2, remaining: 3 });
    expect(state.insertCalls).toHaveLength(1);
    expect(state.insertCalls[0]).toMatchObject({ filesProcessed: 2 });
  });

  it('allows a signed-in free user up to exactly the daily cap', async () => {
    state.sessionUser = { id: 'u1' };
    state.selectQueue = [
      [{ plan: 'free', email: 'a@example.com' }],
      [{ id: 10, filesProcessed: 3, limitNotifiedAt: null }],
    ];

    const result = await checkAndConsumeUsage(fakeRequest(), 2);

    expect(result).toEqual({ allowed: true, plan: 'free', limit: 5, used: 5, remaining: 0 });
    expect(state.updateSetCalls).toContainEqual(expect.objectContaining({ filesProcessed: 5 }));
  });

  it('blocks a request that would exceed the daily cap and emails once', async () => {
    state.sessionUser = { id: 'u1' };
    state.selectQueue = [
      [{ plan: 'free', email: 'a@example.com' }],
      [{ id: 10, filesProcessed: 5, limitNotifiedAt: null }],
    ];

    const result = await checkAndConsumeUsage(fakeRequest(), 1);

    expect(result).toEqual({ allowed: false, plan: 'free', limit: 5, used: 5, remaining: 0 });
    expect(sendUsageLimitReachedEmail).toHaveBeenCalledTimes(1);
    expect(sendUsageLimitReachedEmail).toHaveBeenCalledWith('a@example.com', 'free', 5);
    expect(state.updateSetCalls).toContainEqual(expect.objectContaining({ limitNotifiedAt: expect.any(Date) }));
  });

  it('does not re-send the limit email once already notified today', async () => {
    state.sessionUser = { id: 'u1' };
    state.selectQueue = [
      [{ plan: 'free', email: 'a@example.com' }],
      [{ id: 10, filesProcessed: 5, limitNotifiedAt: new Date() }],
    ];

    await checkAndConsumeUsage(fakeRequest(), 1);

    expect(sendUsageLimitReachedEmail).not.toHaveBeenCalled();
  });

  it('bypasses the daily cap entirely for unlimited plans', async () => {
    state.sessionUser = { id: 'u1' };
    state.selectQueue = [[{ plan: 'pro', email: 'a@example.com' }]];

    const result = await checkAndConsumeUsage(fakeRequest(), 999);

    expect(result).toEqual({ allowed: true, plan: 'pro', limit: null, used: 0, remaining: null });
    expect(state.insertCalls).toHaveLength(0);
    expect(state.updateSetCalls).toHaveLength(0);
  });
});
