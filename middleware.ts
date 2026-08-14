import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 10;

function getAllowedOrigins() {
  return new Set(
    [
      process.env.CORS_ALLOWED_ORIGINS,
      process.env.NEXT_PUBLIC_SITE_URL,
      "http://localhost:3000",
    ]
      .flatMap((value) => (value ? value.split(",") : []))
      .map((value) => value.trim().replace(/\/$/, ""))
      .filter(Boolean),
  );
}

function applyCors(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || !getAllowedOrigins().has(origin)) return response;

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token, X-Requested-With");
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.append("Vary", "Origin");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Preserve the existing canonical-host behavior until the user supplies new domain details.
  if (hostname === "www.knimex.space") {
    return NextResponse.redirect(
      new URL(request.nextUrl.pathname + request.nextUrl.search, "https://knimex.space"),
      301,
    );
  }

  if (pathname.startsWith("/api")) {
    const now = Date.now();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const limitInfo = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    if (now > limitInfo.resetTime) {
      limitInfo.count = 1;
      limitInfo.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
      limitInfo.count += 1;
    }

    rateLimitMap.set(ip, limitInfo);

    if (limitInfo.count > MAX_REQUESTS) {
      return new NextResponse("Too Many Requests - Limit 10/min", {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((limitInfo.resetTime - now) / 1000).toString(),
        },
      });
    }

    if (request.method === "OPTIONS") {
      return applyCors(new NextResponse(null, { status: 204 }), request);
    }
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  if (pathname.startsWith("/api")) applyCors(response, request);
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
