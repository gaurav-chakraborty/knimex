import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET() {
  const checks = {
    supabase_connection: false,
    auth_service: false,
    optional_tables: {
      keep_alive_pings: false,
    },
    errors: [] as string[],
  };

  try {
    const supabase = getSupabaseClient();
    const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

    checks.supabase_connection = !authError;
    checks.auth_service = !authError;
    if (authError) checks.errors.push(`Auth error: ${authError.message}`);

    try {
      const { error: pingError } = await supabase.from("keep_alive_pings").select("id").limit(1);
      checks.optional_tables.keep_alive_pings = !pingError || pingError.code === "PGRST116";
      if (pingError && !checks.optional_tables.keep_alive_pings) {
        checks.errors.push(`Optional table 'keep_alive_pings' unavailable: ${pingError.message}`);
      }
    } catch (tableError) {
      checks.errors.push(
        `Optional table 'keep_alive_pings' check failed: ${tableError instanceof Error ? tableError.message : "unknown error"}`,
      );
    }

    const status = checks.supabase_connection ? (checks.errors.length ? "degraded" : "healthy") : "unhealthy";

    return NextResponse.json(
      {
        status,
        checks,
        timestamp: new Date().toISOString(),
        recommendation: checks.errors.length
          ? "Review optional table availability and Supabase service health"
          : null,
      },
      { status: status === "healthy" ? 200 : status === "degraded" ? 200 : 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Database health check failed",
        checks,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
