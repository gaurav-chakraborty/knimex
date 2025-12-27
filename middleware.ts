import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Simple in-memory rate limiter for the edge/middleware (resets on worker restart)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  
  // 0. Redirect www to non-www for knimex.space
  if (hostname === "www.knimex.space") {
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, `https://knimex.space`), 301);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";
  
  // 1. Rate Limiting for API routes
  if (pathname.startsWith("/api")) {
    const now = Date.now();
    const limitInfo = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    
    if (now > limitInfo.resetTime) {
      limitInfo.count = 1;
      limitInfo.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
      limitInfo.count++;
    }
    
    rateLimitMap.set(ip, limitInfo);
    
    if (limitInfo.count > MAX_REQUESTS) {
      return new NextResponse("Too Many Requests - Limit 10/min", { 
        status: 429,
        headers: {
          "Retry-After": Math.ceil((limitInfo.resetTime - now) / 1000).toString()
        }
      });
    }
  }

  const response = NextResponse.next();

  // 2. Security Headers (CSP, CORS, etc.)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ltnyquqksxinxkbzdtzs.supabase.co";
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https://** http://**;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' ${supabaseUrl} https://api.vercel.com;
      media-src 'self' blob:;
      frame-src 'self';
      worker-src 'self' blob:;
    `.replace(/\s{2,}/g, ' ').trim();


  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // 3. CORS for knimex.space
  const origin = request.headers.get("origin");
  const allowedOrigins = ["https://knimex.space", "https://www.knimex.space", "http://localhost:3000"];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  // 4. Protected admin routes
  if (pathname.startsWith("/admin")) {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      
      if (!session || !session.user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      const isAdmin = session.user.email?.toLowerCase().includes("admin");
      if (!isAdmin) {
        return new NextResponse("Forbidden - Admin access required", { status: 403 });
      }
    } catch (error) {
      console.error("Middleware auth error:", error);
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ],
};