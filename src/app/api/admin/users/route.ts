import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { like, or, desc, count } from 'drizzle-orm';
import { checkAdminAccess } from '@/lib/auth';

// Input sanitization helper
function sanitizeSearchInput(input: string | null): string | null {
  if (!input) return null;

  // Trim and limit length to prevent abuse
  const trimmed = input.trim().slice(0, 100);

  // Remove special SQL characters that could cause issues
  const sanitized = trimmed.replace(/[%_\\]/g, '\\$&');

  return sanitized || null;
}

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess();

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error || 'Unauthorized', code: adminCheck.user ? 'FORBIDDEN' : 'UNAUTHORIZED' },
        { status: adminCheck.user ? 403 : 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const rawSearch = searchParams.get('search');

    // Sanitize search input
    const search = sanitizeSearchInput(rawSearch);

    // Build search filter
    const filter = search ? or(
      like(user.name, `%${search}%`),
      like(user.email, `%${search}%`)
    ) : undefined;

    // Get total count
    const totalResult = await db.select({ count: count() })
      .from(user)
      .where(filter);
    const total = totalResult[0].count;

    // Execute query with pagination and ordering
    const users = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }).from(user)
      .where(filter)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      users,
      total,
    }, { status: 200 });

  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}