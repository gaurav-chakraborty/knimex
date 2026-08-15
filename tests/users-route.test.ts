import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  adminCheckResult: null as any,
  selectCalls: 0,
}));

vi.mock('@/lib/auth', () => ({
  checkAdminAccess: async () => state.adminCheckResult,
}));

vi.mock('@/db', () => ({
  db: {
    select: () => {
      state.selectCalls += 1;
      throw new Error('database should not be touched for rejected requests');
    },
  },
}));

vi.mock('@/db/schema', () => ({
  user: {
    id: 'id',
    name: 'name',
    email: 'email',
    emailVerified: 'emailVerified',
    image: 'image',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
}));

import { GET } from '@/app/api/users/route';

function fakeRequest(url = 'https://knimex.com/filex/api/users') {
  return { url } as unknown as NextRequest;
}

beforeEach(() => {
  state.adminCheckResult = { isAdmin: false, user: null, error: 'Unauthorized' };
  state.selectCalls = 0;
});

describe('GET /api/users', () => {
  it('rejects unauthenticated directory enumeration', async () => {
    const response = await GET(fakeRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe('UNAUTHORIZED');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(state.selectCalls).toBe(0);
  });

  it('rejects authenticated non-admin directory enumeration', async () => {
    state.adminCheckResult = { isAdmin: false, user: { id: 'user-1' }, error: 'Forbidden' };

    const response = await GET(fakeRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe('FORBIDDEN');
    expect(state.selectCalls).toBe(0);
  });
});
