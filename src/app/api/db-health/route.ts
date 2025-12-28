import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const checks = {
    database: false,
    auth: false,
    tables: {
      user_activity: false,
      user_stats: false,
      keep_alive_pings: false
    }
  };

  try {
    // Check 1: Database connection
    const { error: dbError } = await supabase
      .from('user_activity')
      .select('count')
      .limit(1);

    checks.database = !dbError || dbError.code === 'PGRST116';

    // Check 2: Auth service
    try {
      await supabase.auth.getSession();
      checks.auth = true;
    } catch (e) {
      console.warn('Auth check failed:', e);
    }

    // Check 3: Tables exist
    const tables = ['user_activity', 'user_stats', 'keep_alive_pings'];
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        checks.tables[table as keyof typeof checks.tables] = !error || error.code === 'PGRST116';
      } catch (e) {
        console.warn(`Table ${table} check failed:`, e);
      }
    }

    const allHealthy = checks.database && checks.auth && Object.values(checks.tables).every(Boolean);

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString()
    }, { status: allHealthy ? 200 : 503 });

  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      checks,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
