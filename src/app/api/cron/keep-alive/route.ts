import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase client with service role key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  const startTime = Date.now();

  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    console.warn('Unauthorized keep-alive attempt');
    return NextResponse.json({
      error: 'Unauthorized',
      timestamp: new Date().toISOString()
    }, { status: 401 });
  }

  try {
    // Simple query to keep database active
    // Try user_activity table first, fall back to auth.users if it doesn't exist
    let querySuccess = false;
    let error = null;

    try {
      const { error: activityError } = await supabase
        .from('user_activity')
        .select('count')
        .limit(1);

      // PGRST116 = table empty (acceptable)
      // 42P01 = table doesn't exist (need to create tables)
      querySuccess = !activityError || activityError.code === 'PGRST116';
      error = activityError;
    } catch (e) {
      // Fall back to checking auth.users (always exists)
      const { error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });
      querySuccess = !authError;
      error = authError;
    }

    const responseTime = Date.now() - startTime;

    // Try to log ping (table may not exist yet)
    try {
      await supabase
        .from('keep_alive_pings')
        .insert({
          ping_type: 'cron',
          status: querySuccess ? 'success' : 'warning',
          response_time_ms: responseTime,
          error_message: error?.message || null
        });
    } catch (logError: any) {
      console.warn('Could not log ping (table may not exist):', logError.message);
    }

    if (!querySuccess) {
      console.error('Database query failed:', error);
      return NextResponse.json({
        success: false,
        message: 'Database query failed',
        error: error?.message,
        hint: 'Tables may need to be created. Run the SQL setup.',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database is active',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error('Keep-alive ping failed:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Allow POST for manual testing
export async function POST(request: Request) {
  return GET(request);
}
