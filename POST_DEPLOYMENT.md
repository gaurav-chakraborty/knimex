# Post-Deployment Verification Checklist

## Immediate Checks (First 5 Minutes)

### 1. Test Endpoints
```bash
# Homepage
curl -I https://knimex.space
# Expected: HTTP/2 200

# Health
curl https://knimex.space/api/health | jq
# Expected: {"status":"healthy",...}

# Database health
curl https://knimex.space/api/db-health | jq
# Expected: {"status":"healthy"|"degraded",...}

# Keep-alive (replace [SECRET])
curl -H "Authorization: Bearer [CRON_SECRET]" https://knimex.space/api/cron/keep-alive | jq
# Expected: {"success":true,...}
```

### 2. Check Vercel Dashboard
- [ ] Go to https://vercel.com/dashboard
- [ ] Select your project
- [ ] Go to "Crons" tab
- [ ] Verify `/api/cron/keep-alive` appears
- [ ] Status should be "Active"
- [ ] Schedule should be `0 0 * * *` (daily)

### 3. Check Vercel Logs
- [ ] Go to Vercel Dashboard → Your Project → Logs
- [ ] Filter by "Errors"
- [ ] Verify no critical errors in last 15 minutes

## Supabase Setup (Next 15 Minutes)

### 4. Run SQL Setup
- [ ] Go to Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Copy content from `scripts/supabase-setup.sql`
- [ ] Run the SQL script
- [ ] Verify success messages in output

### 5. Verify Tables Created
```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_activity', 'user_stats', 'keep_alive_pings')
ORDER BY table_name;

-- Should return 3 rows
```

### 6. Test Database Health Again
```bash
curl https://knimex.space/api/db-health | jq

# All checks should now pass:
# {
#   "status": "healthy",
#   "checks": {
#     "supabase_connection": true,
#     "auth_service": true,
#     "tables": {
#       "user_activity": true,
#       "user_stats": true,
#       "keep_alive_pings": true
#     }
#   }
# }
```

## UptimeRobot Setup (Next 10 Minutes)

### 7. Configure External Monitoring
- [ ] Follow `UPTIMEROBOT_SETUP.md`
- [ ] Create account at uptimerobot.com
- [ ] Add monitor for keep-alive endpoint
- [ ] Set 5-minute interval
- [ ] Add Authorization header with CRON_SECRET
- [ ] Wait 5 minutes
- [ ] Verify monitor shows "Up" (green)

### 8. Verify Pings in Database
```sql
-- Run in Supabase SQL Editor
SELECT * FROM keep_alive_pings
ORDER BY created_at DESC
LIMIT 10;

-- Should see entries from:
-- 1. Manual test (ping_type='cron')
-- 2. UptimeRobot (every 5 min after setup)
```

## Browser Testing (Next 10 Minutes)

### 9. Manual UI Tests
- [ ] Visit https://knimex.space
- [ ] Upload test image file
- [ ] Edit metadata
- [ ] Download processed file
- [ ] Verify file works
- [ ] Check browser console (F12) - no errors

### 10. Mobile Test
- [ ] Open https://knimex.space on phone
- [ ] Verify responsive layout
- [ ] Test file upload from phone

## Success Criteria

Deployment is successful when:
- ✅ All endpoints return 200 OK
- ✅ Database health check passes
- ✅ Cron job appears in Vercel dashboard
- ✅ All 3 tables exist in Supabase
- ✅ UptimeRobot monitor is green
- ✅ Keep-alive pings logged every 5 minutes
- ✅ No errors in Vercel logs
- ✅ File upload/download works
- ✅ Mobile responsive

## Monitoring (First 24 Hours)

### Check every 6 hours:
```sql
-- Verify pings are happening
SELECT
  COUNT(*) as total_pings,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failure') as failed,
  MAX(created_at) as last_ping
FROM keep_alive_pings
WHERE created_at > NOW() - INTERVAL '6 hours';

-- Should see pings every 5 minutes from UptimeRobot
```

## Rollback Plan

If critical issues found:

### Option 1: Vercel Dashboard Rollback
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Option 2: Git Rollback
```bash
git log --oneline  # Find last good commit
git revert <commit-hash>
git push origin main
```

### Option 3: Emergency Fix
```bash
# Make quick fix
git add .
git commit -m "hotfix: critical issue"
git push origin main
# Wait 2-3 min for deployment
```

---

**Complete this checklist to ensure successful deployment! ✅**
