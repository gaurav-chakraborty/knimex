import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { user, session, analyticsEvents } from '@/db/schema';
import { count, gte, gt } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authSession = await auth.api.getSession({ headers: await headers() });
    
    if (!authSession || !authSession.user) {
      return NextResponse.json({ 
        error: "Unauthorized",
        code: "UNAUTHORIZED" 
      }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = authSession.user;
    const isAdmin = currentUser.email.toLowerCase().includes('admin');
    
    // Alternative check: compare with first user in database
    let isFirstUser = false;
    if (!isAdmin) {
      const firstUser = await db.select({ id: user.id })
        .from(user)
        .orderBy(user.createdAt)
        .limit(1);
      
      if (firstUser.length > 0 && firstUser[0].id === currentUser.id) {
        isFirstUser = true;
      }
    }

    if (!isAdmin && !isFirstUser) {
      return NextResponse.json({ 
        error: "Forbidden - Admin access required",
        code: "FORBIDDEN" 
      }, { status: 403 });
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