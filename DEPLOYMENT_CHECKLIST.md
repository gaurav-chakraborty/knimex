# FileX Deployment Checklist

## Pre-Deployment (Run Locally)

- [ ] Environment variables validated: `npm run validate-env`
- [ ] TypeScript compiles: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Local tests pass: `npm run test-local`

## Supabase Setup

- [ ] Tables created (user_activity, user_stats, keep_alive_pings)
- [ ] RLS policies enabled
- [ ] Service role key in environment variables

## Vercel Setup

- [ ] All environment variables set in Vercel dashboard
- [ ] CRON_SECRET generated and set
- [ ] vercel.json committed to repository
- [ ] Cron job appears in Vercel dashboard after deploy

## Post-Deployment (After Deploy)

- [ ] Homepage loads: https://knimex.space
- [ ] Health check: https://knimex.space/api/health
- [ ] Database health: https://knimex.space/api/db-health
- [ ] Keep-alive (with CRON_SECRET): `curl -H "Authorization: Bearer [SECRET]" https://knimex.space/api/cron/keep-alive`
- [ ] Verify cron job in Vercel dashboard
- [ ] Check for errors in Vercel logs

## Monitoring (First 24 Hours)

- [ ] Check keep_alive_pings table in Supabase (should have entries every 6 hours)
- [ ] Monitor Vercel logs for errors
- [ ] Test file upload flow
- [ ] Verify no 500 errors

## Success Criteria

- ✅ All endpoints return 200
- ✅ Database stays active (no dormancy warning)
- ✅ Keep-alive pings logged successfully
- ✅ No critical errors in logs
