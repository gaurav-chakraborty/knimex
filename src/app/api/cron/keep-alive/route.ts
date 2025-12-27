import { getServiceRoleClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const startTime = Date.now();
  const supabase = getServiceRoleClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    const responseTime = Date.now() - startTime;
    
    await supabase
      .from('keep_alive_pings')
      .insert({
        ping_type: 'cron',
        status: 'success',
        response_time_ms: responseTime
      });
    
    return NextResponse.json({
      success: true,
      message: 'Database is active',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    try {
      await supabase
        .from('keep_alive_pings')
        .insert({
          ping_type: 'cron',
          status: 'failure',
          response_time_ms: responseTime,
          error_message: errorMessage
        });
    } catch {}
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
