# FileX Production Hardening Runbook

The `0006_production_hardening.sql` migration adds Postgres checks for user roles, plans, subscription states, feedback values, and non-negative usage counters. It also adds lookup indexes for user roles/plans, session expiry, Better Auth account and verification lookups, analytics, feedback, and usage records.

Apply migrations through the production database migration process before enabling code that depends on the new invariants. Run the migration in a maintenance window or transaction-aware deployment step, and inspect existing rows first if the database contains legacy values outside the accepted role, plan, subscription, feedback-status, rating, or usage ranges. The migration uses `IF NOT EXISTS` and catalog checks to remain replay-safe, but it does not silently rewrite invalid historical data.

Production should set `DATABASE_URL`, `DATABASE_POOL_MAX=1` when using a Supabase pooler, `BETTER_AUTH_SECRET` to a randomly generated secret of at least 32 characters, `BETTER_AUTH_URL=https://knimex.com/filex`, `NEXT_PUBLIC_SITE_URL=https://knimex.com`, `NEXT_PUBLIC_APP_BASE_PATH=/filex`, and an explicit `CORS_ALLOWED_ORIGINS` list containing only trusted origins. The database health endpoint now probes both the actual Postgres connection and Supabase Auth without exposing connection-string details.

The legacy `/api/users` directory is admin-only. Admin mutations use strict validation, safe user projections, no-store responses, self-demotion/self-deletion guardrails, and audit records that contain changed field names rather than credential or payment secrets. The local Drizzle metadata is from an older SQLite history and is not a reliable validation source for the current PostgreSQL schema; the explicit PostgreSQL migration is the authoritative deployment artifact for this hardening change.

## KNIMEX parent routing

The KNIMEX parent shell is hosted by the same Vercel project as FileX. In production, `vercel.json` rewrites the apex `/` to the internal `/filex/knimex` route, while the product remains available at `/filex`. The rewrite is intentionally configured at Vercel because Next.js rejects a framework rewrite source outside the configured `/filex` basePath. The edge routing file is `src/proxy.ts`, matching the Next.js 16 proxy convention; placing it beside `src/app` is required for the proxy to be compiled. The parent shell uses the shared light/dark theme system and links to the base-path-aware FileX routes.

The Lovable KNIMEX site was temporarily published at `https://knimex-hub-ecosystem.lovable.app/` only to inspect and validate the initial parent design. It must remain online until the Vercel parent shell is verified in production; delete or unpublish the temporary Lovable publication only after explicit final confirmation.

After the parent-shell release is verified, restore Vercel’s `Require Verified Commits` setting. The setting was temporarily relaxed only because the connected GitHub account could not sign the deployment commit from this environment.
