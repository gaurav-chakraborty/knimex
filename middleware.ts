import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 10;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  
  if (hostname === "www.knimex.space") {
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, `https://knimex.space`), 301);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";
  
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ltnyquqksxinxkbzdtzs.supabase.co";
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://slelguoygbfzlpylpxfs.supabase.co;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://** http://**;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' ${supabaseUrl} https://api.vercel.com https://slelguoygbfzlpylpxfs.supabase.co;
    media-src 'self' blob:;
    frame-src 'self';
    worker-src 'self' blob:;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  const origin = request.headers.get("origin");
  const allowedOrigins = ["https://knimex.space", "https://www.knimex.space", "http://localhost:3000"];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  if (pathname.startsWith("/admin")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
  ],
};