import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 10;

function getBasePath() {
  return (process.env.NEXT_PUBLIC_APP_BASE_PATH ?? (process.env.NODE_ENV === 'production' ? '/filex' : '')).replace(/\/$/, '');
}

function getRoutePath(pathname: string) {
  const basePath = getBasePath();
  if (basePath && pathname.startsWith(basePath)) {
    return pathname.slice(basePath.length) || '/';
  }
  return pathname;
}

function getAllowedOrigins() {
  return new Set(
    [
      process.env.CORS_ALLOWED_ORIGINS,
      process.env.NEXT_PUBLIC_SITE_URL,
      'http://localhost:3000',
    ]
      .flatMap((value) => (value ? value.split(',') : []))
      .map((value) => value.trim().replace(/\/$/, ''))
      .filter(Boolean),
  );
}

function applyCors(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || !getAllowedOrigins().has(origin)) return response;

  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.append('Vary', 'Origin');
  return response;
}

function markPrivate(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const routePath = getRoutePath(pathname);
  const hostname = request.headers.get('host') || '';
  const basePath = getBasePath();
  const isApi = routePath === '/api' || routePath.startsWith('/api/');
  const isAdminPage = routePath === '/admin' || routePath.startsWith('/admin/');

  // Preserve the existing canonical-host behavior until the user supplies new domain details.
  if (hostname === 'www.knimex.space') {
    return NextResponse.redirect(
      new URL(pathname + request.nextUrl.search, 'https://knimex.space'),
      301,
    );
  }

  if (isApi) {
    const now = Date.now();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    const limitInfo = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    if (now > limitInfo.resetTime) {
      limitInfo.count = 1;
      limitInfo.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
      limitInfo.count += 1;
    }

    rateLimitMap.set(ip, limitInfo);

    if (limitInfo.count > MAX_REQUESTS) {
      return markPrivate(new NextResponse('Too Many Requests - Limit 10/min', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((limitInfo.resetTime - now) / 1000).toString(),
        },
      }));
    }

    if (request.method === 'OPTIONS') {
      return markPrivate(applyCors(new NextResponse(null, { status: 204 }), request));
    }
  }

  if (isAdminPage) {
    const loginUrl = new URL(`${basePath}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  if (isApi) markPrivate(applyCors(response, request));
  return response;
}

export const config = {
  matcher: ['/', '/admin/:path*', '/api/:path*', '/filex/admin/:path*', '/filex/api/:path*'],
};
