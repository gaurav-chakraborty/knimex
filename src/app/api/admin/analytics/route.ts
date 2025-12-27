import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { analyticsEvents, user } from '@/db/schema';
import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Admin check - email contains "admin" or user.id matches first user
    const isEmailAdmin = session.user.email?.toLowerCase().includes('admin');
    
    let isFirstUser = false;
    if (!isEmailAdmin) {
      const firstUser = await db.select({ id: user.id })
        .from(user)
        .orderBy(user.createdAt)
        .limit(1);
      
      if (firstUser.length > 0 && firstUser[0].id === session.user.id) {
        isFirstUser = true;
      }
    }

    if (!isEmailAdmin && !isFirstUser) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
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