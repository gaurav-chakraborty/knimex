# FileX Deployment & Operations Guide

## Overview
FileX is a high-performance, client-side metadata erasure platform built with Next.js 15, Turso (SQLite), and Better Auth. This guide covers the production deployment protocol and post-launch operations.

## Pre-Deployment Protocol (Mega Prompt 8)
Before pushing to production, you **MUST** run the automated sanity check:

```bash
node scripts/pre-deploy-check.js
```

### Validation Checklist:
1. **Environment**: All secrets (Turso, Better Auth) must be set in Vercel/Production dashboard.
2. **Database**: Migration sync via `bunx drizzle-kit push`.
3. **Auth**: `BETTER_AUTH_URL` must match the production domain.
4. **Client-side**: Verify `jszip` and `jspdf` are bundled correctly.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion.
- **Backend**: Next.js Server Actions & API Routes.
- **Database**: Turso (LibSQL) with Drizzle ORM.
- **Auth**: Better Auth (Secure Session Management).
- **Processing**: Client-side V8 processing (Local-only metadata stripping).

## Deployment Steps (Vercel)
1. Link your GitHub repository to Vercel.
2. Add the following Environment Variables:
   - `TURSO_CONNECTION_URL`
   - `TURSO_AUTH_TOKEN`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL` (e.g., `https://filex.security`)
   - `NEXT_PUBLIC_SITE_URL` (e.g., `https://filex.security`)
3. Run `npm run build` to verify the build manifest.
4. Deploy to production.

## Maintenance & Debugging
- **Admin Dashboard**: Accessible at `/admin/debug` (Requires Admin role).
- **Logs**: System health and diagnostic logs are available in the Admin Dashboard.
- **Purge Protocol**: Temp files are handled via browser `IndexedDB` or local state and are purged on session close.

## Future Scope
1. **PWA Support**: Full offline processing capabilities.
2. **Enterprise API**: REST endpoints for bulk organizational processing.
3. **Advanced AI**: Computer vision to detect sensitive content within images (not just metadata).

---
© 2025 Cyphertech Consultancy. Confidential & Proprietary.
