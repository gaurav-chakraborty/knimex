import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  insertCalls: [] as Array<Record<string, unknown>>,
  session: null as { user: { id: string } } | null,
}));

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: async () => state.session,
    },
  },
}));

vi.mock('@/db/schema', () => ({
  enquiries: {},
  jobApplications: {},
}));

vi.mock('@/db', () => ({
  db: {
    insert: () => ({
      values: (record: Record<string, unknown>) => ({
        returning: async () => {
          state.insertCalls.push(record);
          return [{ id: 1, ...record, createdAt: new Date(), status: record.status }];
        },
      }),
    }),
  },
}));

import { POST as postEnquiry } from '@/app/filex/api/enquiries/route';
import { POST as postApplication } from '@/app/filex/api/job-applications/route';

function fakeRequest(body: unknown) {
  return { json: async () => body } as unknown as NextRequest;
}

beforeEach(() => {
  state.insertCalls = [];
  state.session = { user: { id: 'user-1' } };
});

describe('public durable submissions', () => {
  it('stores a validated enquiry with the current user association', async () => {
    const response = await postEnquiry(fakeRequest({
      name: 'Asha Applicant',
      email: 'asha@example.com',
      type: 'partnership',
      message: 'Please discuss an enterprise partnership.',
    }));

    expect(response.status).toBe(201);
    expect(state.insertCalls[0]).toMatchObject({
      userId: 'user-1',
      name: 'Asha Applicant',
      email: 'asha@example.com',
      type: 'partnership',
      status: 'new',
    });
  });

  it('rejects an invalid enquiry before writing to the database', async () => {
    const response = await postEnquiry(fakeRequest({ name: '', email: 'invalid', message: '' }));
    expect(response.status).toBe(400);
    expect(state.insertCalls).toHaveLength(0);
  });

  it('stores a validated job application with optional links', async () => {
    const response = await postApplication(fakeRequest({
      name: 'Ravi Engineer',
      email: 'ravi@example.com',
      role: 'Product Engineer',
      portfolioUrl: 'https://example.com/portfolio',
      coverLetter: 'I build reliable, privacy-preserving products.',
    }));

    expect(response.status).toBe(201);
    expect(state.insertCalls[0]).toMatchObject({
      userId: 'user-1',
      role: 'Product Engineer',
      portfolioUrl: 'https://example.com/portfolio',
      resumeUrl: null,
      status: 'new',
    });
  });

  it('rejects an incomplete job application before writing to the database', async () => {
    const response = await postApplication(fakeRequest({ email: 'ravi@example.com', role: 'Engineer' }));
    expect(response.status).toBe(400);
    expect(state.insertCalls).toHaveLength(0);
  });
});
