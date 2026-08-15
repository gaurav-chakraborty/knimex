import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  const startTime = Date.now();

  if (!isAuthorized(request)) {
    console.warn("Unauthorized keep-alive attempt");
    return NextResponse.json(
      { error: "Unauthorized", timestamp: new Date().toISOString() },
      { status: 401 },
    );
  }

  try {
    const supabase = getSupabaseClient();
    const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    const responseTime = Date.now() - startTime;

    if (authError) {
      console.error("Supabase auth health check failed", authError);
      return NextResponse.json(
        {
          success: false,
          status: "degraded",
          message: "Supabase auth service is unavailable",
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    // Logging is best-effort. A missing optional table must not turn a healthy
    // Supabase connection into a failed cron invocation.
    try {
      await supabase.from("keep_alive_pings").insert({
        ping_type: "cron",
        status: "success",
        response_time_ms: responseTime,
        error_message: null,
      });
    } catch (loggingError) {
      console.warn("Keep-alive ping logging skipped", loggingError);
    }

    return NextResponse.json({
      success: true,
      status: "healthy",
      message: "Supabase auth service is active",
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Keep-alive health check failed", error);
    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Keep-alive health check failed",
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
