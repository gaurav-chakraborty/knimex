import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { feedbackSubmissions, user } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
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

    // Admin check
    const isAdmin = session.user.email.toLowerCase().includes('admin');
    
    // Alternative admin check: verify if user is the first user in database
    let isFirstUser = false;
    if (!isAdmin) {
      const firstUser = await db.select()
        .from(user)
        .orderBy(user.createdAt)
        .limit(1);
      
      if (firstUser.length > 0 && firstUser[0].id === session.user.id) {
        isFirstUser = true;
      }
    }

    if (!isAdmin && !isFirstUser) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build query with filters
    const conditions = [];

    // Filter by type if provided
    if (type && ['review', 'feature', 'partnership', 'bug', 'support', 'praise'].includes(type)) {
      conditions.push(eq(feedbackSubmissions.category, type));
    }

    // Filter by status if provided
    if (status && ['new', 'reviewed', 'resolved'].includes(status)) {
      conditions.push(eq(feedbackSubmissions.status, status));
    }

    const filter = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count with same filters
    const totalResult = await db.select({ count: count() })
      .from(feedbackSubmissions)
      .where(filter);
    const total = totalResult[0].count;

    // Execute query with pagination and ordering
    const feedback = await db.select()
      .from(feedbackSubmissions)
      .where(filter)
      .orderBy(desc(feedbackSubmissions.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(
      {
        feedback,
        total
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}