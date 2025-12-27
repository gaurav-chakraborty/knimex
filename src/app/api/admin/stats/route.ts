import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, session, analyticsEvents } from '@/db/schema';
import { count, gte, gt } from 'drizzle-orm';
import { checkAdminAccess } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess();

    if (!adminCheck.isAdmin) {
      return NextResponse.json({
        error: adminCheck.error || "Unauthorized",
        code: adminCheck.user ? "FORBIDDEN" : "UNAUTHORIZED"
      }, { status: adminCheck.user ? 403 : 401 });
    }

    // Calculate statistics
    
    // 1. Total users
    const totalUsersResult = await db.select({ count: count() })
      .from(user);
    const totalUsers = totalUsersResult[0].count;

    // 2. Today's registrations
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const todaysRegistrationsResult = await db.select({ count: count() })
      .from(user)
      .where(gte(user.createdAt, startOfToday));
    const todaysRegistrations = todaysRegistrationsResult[0].count;

    // 3. Total analytics events
    const totalEventsResult = await db.select({ count: count() })
      .from(analyticsEvents);
    const totalEvents = totalEventsResult[0].count;

    // 4. Active sessions
    const now = new Date();
    const activeSessionsResult = await db.select({ count: count() })
      .from(session)
      .where(gt(session.expiresAt, now));
    const activeSessions = activeSessionsResult[0].count;

    // Return statistics
    return NextResponse.json({
      totalUsers,
      todaysRegistrations,
      totalEvents,
      activeSessions
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}