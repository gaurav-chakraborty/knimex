import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    supabase_connection: false,
    auth_service: false,
    tables: {
      user_activity: false,
      user_stats: false,
      keep_alive_pings: false
    },
    errors: [] as string[]
  };

  try {
    // Check 1: Supabase connection via auth service
    try {
      const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      checks.supabase_connection = !error;
      checks.auth_service = !error;
      if (error) checks.errors.push(`Auth error: ${error.message}`);
    } catch (e: any) {
      checks.errors.push(`Connection error: ${e.message}`);
    }

    // Check 2: Required tables
    const tables = ['user_activity', 'user_stats', 'keep_alive_pings'];
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count')
          .limit(1);

        // Table exists if no error or just empty (PGRST116)
        const exists = !error || error.code === 'PGRST116';
        checks.tables[table as keyof typeof checks.tables] = exists;

        if (!exists) {
          checks.errors.push(`Table '${table}' missing or inaccessible`);
        }
      } catch (e: any) {
        checks.errors.push(`Table '${table}' check failed: ${e.message}`);
      }
    }

    // Overall health
    const allTablesExist = Object.values(checks.tables).every(Boolean);
    const isHealthy = checks.supabase_connection && checks.auth_service && allTablesExist;

    const status = isHealthy ? 'healthy' :
                   checks.supabase_connection ? 'degraded' : 'unhealthy';

    return NextResponse.json({
      status,
      checks,
      timestamp: new Date().toISOString(),
      recommendation: !allTablesExist ?
        'Run the Supabase SQL setup to create missing tables' : null
    }, {
      status: isHealthy ? 200 : 503
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      checks,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
