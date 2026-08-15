import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  selectQueue: [] as any[][],
  updateSetCalls: [] as any[],
  updateReturnRows: [] as any[][],
  deleteCalls: [] as any[],
  deleteReturnRows: [] as any[][],
  adminCheckResult: null as any,
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
        return {
          where: () => ({
            returning: async () => state.updateReturnRows.shift() ?? [{ id: 'unknown', ...vals }],
          }),
        };
      },
    }),
    delete: () => ({
      where: (cond: any) => {
        state.deleteCalls.push(cond);
        return {
          returning: async () => state.deleteReturnRows.shift() ?? [{ id: 'deleted-user' }],
        };
      },
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  user: { id: 'id', email: 'email', role: 'role', plan: 'plan' },
}));

vi.mock('@/lib/auth', () => ({
  checkAdminAccess: async () => state.adminCheckResult,
}));

const logAdminAction = vi.fn(async (_params: Record<string, unknown>) => {});
vi.mock('@/lib/admin-audit', () => ({
  logAdminAction: (params: Record<string, unknown>) => logAdminAction(params),
}));

import { PATCH, DELETE } from '@/app/filex/api/admin/users/[id]/route';

function fakeRequest(body: unknown = {}): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  state.selectQueue = [];
  state.updateSetCalls = [];
  state.updateReturnRows = [];
  state.deleteCalls = [];
  state.deleteReturnRows = [];
  state.adminCheckResult = { isAdmin: true, user: { id: 'admin-1' } };
  logAdminAction.mockClear();
});

describe('PATCH /api/admin/users/[id]', () => {
  it('rejects non-admins', async () => {
    state.adminCheckResult = { isAdmin: false, user: { id: 'u1' }, error: 'Forbidden' };
    const res = await PATCH(fakeRequest({ role: 'admin' }), params('u1'));
    expect(res.status).toBe(403);
    expect(state.updateSetCalls).toHaveLength(0);
  });

  it('returns 404 for a nonexistent user', async () => {
    state.selectQueue = [[]];
    const res = await PATCH(fakeRequest({ plan: 'pro' }), params('missing'));
    expect(res.status).toBe(404);
  });

  it('blocks an admin from demoting their own role', async () => {
    state.selectQueue = [[{ id: 'admin-1', role: 'admin' }]];
    const res = await PATCH(fakeRequest({ role: 'user' }), params('admin-1'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('SELF_DEMOTION_BLOCKED');
    expect(state.updateSetCalls).toHaveLength(0);
  });

  it('allows an admin to keep their own role as admin', async () => {
    state.selectQueue = [[{ id: 'admin-1', role: 'admin' }]];
    state.updateReturnRows = [[{ id: 'admin-1', role: 'admin', plan: 'pro' }]];
    const res = await PATCH(fakeRequest({ role: 'admin', plan: 'pro' }), params('admin-1'));

    expect(res.status).toBe(200);
    expect(state.updateSetCalls[0]).toMatchObject({ role: 'admin', plan: 'pro' });
  });

  it('rejects an invalid role', async () => {
    state.selectQueue = [[{ id: 'u2', role: 'user' }]];
    const res = await PATCH(fakeRequest({ role: 'superadmin' }), params('u2'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('INVALID_ROLE');
  });

  it('updates role/plan for another user and logs the change', async () => {
    state.selectQueue = [[{ id: 'u2', role: 'user' }]];
    state.updateReturnRows = [[{ id: 'u2', role: 'admin', plan: 'enterprise' }]];
    const res = await PATCH(fakeRequest({ role: 'admin', plan: 'enterprise' }), params('u2'));

    expect(res.status).toBe(200);
    expect(state.updateSetCalls[0]).toMatchObject({ role: 'admin', plan: 'enterprise' });
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'admin-1', action: 'admin_user_updated', targetUserId: 'u2' })
    );
  });

  it('rejects an invalid boolean instead of coercing it', async () => {
    state.selectQueue = [[{ id: 'u2', role: 'user' }]];
    const res = await PATCH(fakeRequest({ emailVerified: 'false' }), params('u2'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('INVALID_EMAIL_VERIFIED');
    expect(state.updateSetCalls).toHaveLength(0);
  });

  it('rejects an empty update body', async () => {
    state.selectQueue = [[{ id: 'u2', role: 'user' }]];
    const res = await PATCH(fakeRequest({}), params('u2'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('NO_CHANGES');
  });
});

describe('DELETE /api/admin/users/[id]', () => {
  it('blocks an admin from deleting their own account', async () => {
    const res = await DELETE(fakeRequest(), params('admin-1'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe('SELF_DELETE_BLOCKED');
    expect(state.deleteCalls).toHaveLength(0);
  });

  it('returns 404 for a nonexistent user', async () => {
    state.selectQueue = [[]];
    const res = await DELETE(fakeRequest(), params('missing'));
    expect(res.status).toBe(404);
  });

  it('deletes another user and logs the action', async () => {
    state.selectQueue = [[{ id: 'u2', email: 'u2@example.com' }]];
    const res = await DELETE(fakeRequest(), params('u2'));

    expect(res.status).toBe(200);
    expect(state.deleteCalls).toHaveLength(1);
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: 'admin-1', action: 'admin_user_deleted', targetUserId: 'u2' })
    );
  });
});
