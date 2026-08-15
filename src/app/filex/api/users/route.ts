import { NextRequest } from 'next/server';
import { asc, desc, like, or } from 'drizzle-orm';
import { db } from '@/db';
import { user } from '@/db/schema';
import { checkAdminAccess } from '@/lib/auth';
import { privateJson } from '@/lib/admin-validation';

const SORT_FIELDS = ['createdAt', 'name', 'email'] as const;
type SortField = (typeof SORT_FIELDS)[number];

function parseBoundedInteger(value: string | null, fallback: number, minimum: number, maximum: number) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  return Math.min(Math.max(Number.parseInt(value, 10), minimum), maximum);
}

function sanitizeSearchInput(value: string | null) {
  const trimmed = value?.trim().slice(0, 100) ?? '';
  return trimmed ? trimmed.replace(/[%_\\]/g, '\\$&') : null;
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.isAdmin) {
      return privateJson(
        { error: adminCheck.error || 'Unauthorized', code: adminCheck.user ? 'FORBIDDEN' : 'UNAUTHORIZED' },
        adminCheck.user ? 403 : 401,
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInteger(searchParams.get('limit'), 50, 1, 100);
    const offset = parseBoundedInteger(searchParams.get('offset'), 0, 0, 100_000);
    const search = sanitizeSearchInput(searchParams.get('search'));
    const requestedSort = searchParams.get('sortBy');
    const sortField: SortField = SORT_FIELDS.includes(requestedSort as SortField)
      ? (requestedSort as SortField)
      : 'createdAt';
    const sortDirection = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const filter = search
      ? or(like(user.name, `%${search}%`), like(user.email, `%${search}%`))
      : undefined;

    const orderByClause = sortDirection === 'asc'
      ? sortField === 'createdAt'
        ? asc(user.createdAt)
        : sortField === 'name'
          ? asc(user.name)
          : asc(user.email)
      : sortField === 'createdAt'
        ? desc(user.createdAt)
        : sortField === 'name'
          ? desc(user.name)
          : desc(user.email);

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(filter)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return privateJson(
      users.map((record) => ({
        ...record,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error('GET users error:', error);
    return privateJson({ error: 'User directory unavailable', code: 'INTERNAL_SERVER_ERROR' }, 500);
  }
}
