# Production Deployment Checklist

## Pre-Deployment (1 hour before)
- [ ] Run `node scripts/pre-deploy-check.js`
- [ ] All checks pass
- [ ] Complete manual testing checklist
- [ ] Review git diff one final time

## Environment Setup
- [ ] Verify production environment variables in Vercel
- [ ] Double-check TURSO_CONNECTION_URL points to production DB
- [ ] Verify NEXT_PUBLIC_SITE_URL is production domain

## Deployment (15 minutes)
- [ ] Push to main or deploy via Vercel dashboard
- [ ] Check build logs for errors
- [ ] Verify deployment URL matches expected

## Immediate Verification
- [ ] Visit homepage
- [ ] Upload and process 1 test file
- [ ] Create test account
- [ ] Login/logout works
