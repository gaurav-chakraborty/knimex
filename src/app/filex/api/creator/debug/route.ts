import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, session, analyticsEvents, feedbackSubmissions } from '@/db/schema';
import { count, desc } from 'drizzle-orm';
import { checkAdminAccess } from '@/lib/auth';
import os from 'os';

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess();

    if (!adminCheck.isAdmin || !adminCheck.user) {
      return NextResponse.json({
        error: adminCheck.error || "Unauthorized"
      }, { status: adminCheck.user ? 403 : 401, headers: { "Cache-Control": "no-store" } });
    }

    const authUser = adminCheck.user;

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
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasBetterAuthSecret: !!(process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      basePath: process.env.NEXT_PUBLIC_APP_BASE_PATH || "",
    };

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      creator: {
        id: authUser.id,
        email: authUser.email,
        isAdmin: true
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
