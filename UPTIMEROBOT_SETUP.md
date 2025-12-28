# UptimeRobot Setup Guide
## Free External Keep-Alive Service

UptimeRobot is a free monitoring service that can ping your keep-alive endpoint every 5 minutes, providing redundancy beyond Vercel's daily cron.

## Why Use UptimeRobot?

- ✅ **Free tier:** 50 monitors, 5-minute intervals
- ✅ **More reliable:** External service, not dependent on Vercel
- ✅ **Email alerts:** Get notified if your site goes down
- ✅ **No code changes:** Just configure and forget

## Setup Steps (5 minutes)

### 1. Create Account
- Go to: https://uptimerobot.com
- Click "Sign Up Free"
- Verify email

### 2. Add Monitor
- Click "+ Add New Monitor"
- Configure:
  - **Monitor Type:** HTTP(s)
  - **Friendly Name:** FileX Keep-Alive
  - **URL:** `https://knimex.space/api/cron/keep-alive`
  - **Monitoring Interval:** 5 minutes

### 3. Add Authorization Header
- Click "Advanced Settings"
- Scroll to "Custom HTTP Headers"
- Add header:
  - **Name:** `Authorization`
  - **Value:** `Bearer [YOUR_CRON_SECRET]`

**IMPORTANT:** Replace `[YOUR_CRON_SECRET]` with your actual secret from `.env`

### 4. Configure Alerts
- Under "Alert Contacts"
- Add your email
- Select notification preferences

### 5. Save & Verify
- Click "Create Monitor"
- Wait 5 minutes
- Check monitor status (should be green "Up")
- Verify in Supabase: `SELECT * FROM keep_alive_pings ORDER BY created_at DESC LIMIT 5;`

## Troubleshooting

**Monitor shows "Down":**
- Check URL is correct: `https://knimex.space/api/cron/keep-alive`
- Verify Authorization header is set with correct secret
- Test manually: `curl -H "Authorization: Bearer [SECRET]" https://knimex.space/api/cron/keep-alive`

**No pings in database:**
- Tables may not exist yet - run Supabase SQL setup
- Check keep-alive endpoint logs in Vercel

## Monitoring Dashboard

Once set up, you can:
- View uptime percentage
- See response times
- Get downtime alerts
- Review incident logs

Your database will now be pinged:
- Every 24 hours by Vercel cron (free)
- Every 5 minutes by UptimeRobot (free)

**Double redundancy = bulletproof keep-alive! 🚀**
