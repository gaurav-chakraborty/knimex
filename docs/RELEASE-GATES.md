# FileX enterprise release gates

FileX uses deterministic dependency installation through `npm ci`, strict security-hygiene checks, production dependency auditing, environment-shape validation, unit tests, direct ESLint, TypeScript validation, and a webpack production build before Vercel promotion.

Post-deploy verification accepts an explicit Vercel deployment URL and checks the homepage, health endpoint, database health, authenticated keep-alive behavior when `CRON_SECRET` is available, and unauthenticated keep-alive rejection. Domain and DNS changes are intentionally managed separately.
