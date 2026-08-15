import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db, databaseConfigured } from '@/db';

export const dynamic = 'force-dynamic';

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function response(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      Pragma: 'no-cache',
    },
  });
}

export async function GET() {
  const checks = {
    database: {
      configured: databaseConfigured,
      connection: false,
    },
    auth_service: false,
    optional_tables: {
      keep_alive_pings: false,
    },
    errors: [] as string[],
  };

  if (!databaseConfigured) {
    checks.errors.push('DATABASE_URL_NOT_CONFIGURED');
  } else {
    try {
      await db.execute(sql`select 1`);
      checks.database.connection = true;
    } catch (error) {
      console.error('Postgres health probe failed:', error);
      checks.errors.push('POSTGRES_UNAVAILABLE');
    }
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    checks.errors.push('SUPABASE_AUTH_NOT_CONFIGURED');
  } else {
    try {
      const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      checks.auth_service = !authError;
      if (authError) {
        console.error('Supabase Auth health probe failed:', authError);
        checks.errors.push('SUPABASE_AUTH_UNAVAILABLE');
      }
    } catch (error) {
      console.error('Supabase Auth health probe threw:', error);
      checks.errors.push('SUPABASE_AUTH_UNAVAILABLE');
    }

    try {
      const { error: pingError } = await supabase.from('keep_alive_pings').select('id').limit(1);
      checks.optional_tables.keep_alive_pings = !pingError || pingError.code === 'PGRST116';
      if (pingError && !checks.optional_tables.keep_alive_pings) {
        checks.errors.push('OPTIONAL_KEEP_ALIVE_TABLE_UNAVAILABLE');
      }
    } catch (error) {
      console.error('Optional keep_alive_pings probe failed:', error);
      checks.errors.push('OPTIONAL_KEEP_ALIVE_TABLE_UNAVAILABLE');
    }
  }

  const requiredHealthy = checks.database.connection && checks.auth_service;
  const status = requiredHealthy ? (checks.errors.length > 0 ? 'degraded' : 'healthy') : 'unhealthy';
  const httpStatus = status === 'unhealthy' ? 503 : 200;

  return response(
    {
      status,
      checks,
      timestamp: new Date().toISOString(),
      recommendation: checks.errors.length > 0 ? 'Review the reported production health checks.' : null,
    },
    httpStatus,
  );
}
