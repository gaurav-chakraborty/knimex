import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { user, session, analyticsEvents, feedbackSubmissions } from '@/db/schema';
import { count, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import os from 'os';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate and check if creator/admin
    const authSession = await auth.api.getSession({ headers: await headers() });
    
    // For extreme security, we could also check a secret header
    // const masterKey = request.headers.get('x-master-key');
    // if (masterKey !== process.env.MASTER_KEY) ...

    if (!authSession || !authSession.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = authSession.user.email.toLowerCase().includes('admin');
    
    // Get first user to see if current user is the creator
    const firstUser = await db.select({ id: user.id })
      .from(user)
      .orderBy(user.createdAt)
      .limit(1);
    
    const isCreator = firstUser.length > 0 && firstUser[0].id === authSession.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Gather Debug & Monitor Data
    
    // Database Stats
    const [userCount] = await db.select({ val: count() }).from(user);
    const [sessionCount] = await db.select({ val: count() }).from(session);
    const [eventCount] = await db.select({ val: count() }).from(analyticsEvents);
    const [feedbackCount] = await db.select({ val: count() }).from(feedbackSubmissions);

    // Recent Activity
    const recentEvents = await db.select()
      .from(analyticsEvents)
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(5);

    const recentFeedback = await db.select()
      .from(feedbackSubmissions)
      .orderBy(desc(feedbackSubmissions.createdAt))
      .limit(5);

    // System Info
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      freeMem: os.freemem(),
      totalMem: os.totalmem(),
      loadAvg: os.loadavg(),
      cpus: os.cpus().length,
      nodeVersion: process.version,
    };

    // Environment Check (Safely)
    const envCheck = {
      isProduction: process.env.NODE_ENV === 'production',
      hasTursoUrl: !!process.env.TURSO_CONNECTION_URL,
      hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
      hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    };

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      creator: {
        id: authSession.user.id,
        email: authSession.user.email,
        isCreator,
        isAdmin
      },
      metrics: {
        totalUsers: userCount.val,
        activeSessions: sessionCount.val,
        totalEvents: eventCount.val,
        totalFeedback: feedbackCount.val,
      },
      activity: {
        recentEvents,
        recentFeedback
      },
      system: systemInfo,
      environment: envCheck
    });

  } catch (error) {
    console.error('Master API Error:', error);
    return NextResponse.json({ 
      status: "error",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
