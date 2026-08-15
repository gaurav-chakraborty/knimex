import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { sql, gte, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Calculate date thresholds
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get total users count
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Get new users today
    const newUsersTodayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(gte(user.createdAt, startOfToday));
    const newUsersToday = newUsersTodayResult[0]?.count || 0;

    // Get new users this week (last 7 days)
    const newUsersThisWeekResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(gte(user.createdAt, sevenDaysAgo));
    const newUsersThisWeek = newUsersThisWeekResult[0]?.count || 0;

    // Get new users this month (last 30 days)
    const newUsersThisMonthResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(gte(user.createdAt, thirtyDaysAgo));
    const newUsersThisMonth = newUsersThisMonthResult[0]?.count || 0;

    // Get daily user growth for last 30 days
    const userGrowthResult = await db
      .select({
        date: sql<string>`date(${user.createdAt}, 'unixepoch')`,
        count: sql<number>`count(*)`
      })
      .from(user)
      .where(gte(user.createdAt, thirtyDaysAgo))
      .groupBy(sql`date(${user.createdAt}, 'unixepoch')`)
      .orderBy(sql`date(${user.createdAt}, 'unixepoch') ASC`);

    // Create a map of existing dates with counts
    const growthMap = new Map<string, number>();
    userGrowthResult.forEach(row => {
      growthMap.set(row.date, row.count);
    });

    // Fill in missing days with 0 counts
    const userGrowth: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      userGrowth.push({
        date: dateString,
        count: growthMap.get(dateString) || 0
      });
    }

    return NextResponse.json({
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      userGrowth
    }, { status: 200 });

  } catch (error) {
    console.error('GET analytics error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'ANALYTICS_ERROR'
      },
      { status: 500 }
    );
  }
}