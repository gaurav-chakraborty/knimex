import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

export async function GET(request: Request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Simple database query to keep connection alive
    const { data, error } = await supabase
      .from('user_activity')
      .select('count')
      .limit(1);

    // PGRST116 = table empty, which is fine
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const responseTime = Date.now() - startTime;

    // Try to log ping (table may not exist yet)
    try {
      await supabase
        .from('keep_alive_pings')
        .insert({
          ping_type: 'cron',
          status: 'success',
          response_time_ms: responseTime
        });
    } catch (logError) {
      console.warn('Could not log ping (table may not exist):', logError);
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
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
