import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import { checkAdminAccess } from '@/lib/auth';

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
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get('eventType');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 500);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build WHERE conditions
    const conditions = [];

    if (eventType) {
      conditions.push(eq(analyticsEvents.eventType, eventType));
    }

    if (userId) {
      conditions.push(eq(analyticsEvents.userId, userId));
    }

    if (startDate) {
      conditions.push(gte(analyticsEvents.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(analyticsEvents.createdAt, endDate));
    }

    // Build WHERE clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Execute query with pagination and ordering
    const events = await db.select()
      .from(analyticsEvents)
      .where(whereClause)
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db.select({ count: count() })
      .from(analyticsEvents)
      .where(whereClause);
    
    const total = totalResult[0]?.count ?? 0;

    return NextResponse.json(
      {
        events,
        total
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}