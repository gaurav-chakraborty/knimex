# 🚀 FileX by KNIMEX - Deployment Guide

Complete guide to deploy your FileX application to production using Vercel and Turso.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Database Setup (Turso)](#database-setup-turso)
4. [Vercel Deployment](#vercel-deployment)
5. [Post-Deployment Checklist](#post-deployment-checklist)
6. [Troubleshooting](#troubleshooting)
7. [Future Enhancements](#future-enhancements)

---

## 🔧 Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed locally
- ✅ A [GitHub](https://github.com) account
- ✅ A [Vercel](https://vercel.com) account
- ✅ A [Turso](https://turso.tech) account (free tier available)
- ✅ Git installed and repository pushed to GitHub

---

## 🔐 Environment Variables

Your application requires these environment variables for production:

### Required Variables

```bash
# Database (Turso)
TURSO_CONNECTION_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Authentication (better-auth)
BETTER_AUTH_SECRET=your-64-character-random-string

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### How to Generate BETTER_AUTH_SECRET

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or use this online tool: [Generate Random String](https://www.random.org/strings/)

---

## 🗄️ Database Setup (Turso)

### Step 1: Create Turso Account

1. Go to [https://turso.tech](https://turso.tech)
2. Sign up for a free account
3. Verify your email

### Step 2: Create Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login to Turso
turso auth login

# Create a new database
turso db create filex-production

# Get connection URL
turso db show filex-production --url

# Create auth token
turso db tokens create filex-production
```

### Step 3: Run Migrations

After getting your credentials, run migrations locally first to test:

```bash
# Install dependencies
npm install

# Set environment variables
export TURSO_CONNECTION_URL="your-connection-url"
export TURSO_AUTH_TOKEN="your-auth-token"

# Run database migrations
npm run db:push

# Or using drizzle-kit directly
npx drizzle-kit push
```

### Step 4: Verify Database

```bash
# Open Turso shell to verify tables
turso db shell filex-production

# List all tables
.tables

# Expected tables:
# - user
# - session
# - account
# - verification
# - analytics_events
# - feedback_submissions

# Exit shell
.exit
```

---

## ☁️ Vercel Deployment

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Add Environment Variables**
   
   In the Vercel dashboard, go to "Environment Variables" and add:

   ```
   TURSO_CONNECTION_URL = libsql://your-database.turso.io
   TURSO_AUTH_TOKEN = eyJhbGc...your-token
   BETTER_AUTH_SECRET = your-generated-secret
   NEXT_PUBLIC_SITE_URL = https://your-project.vercel.app
   ```

   **Important:** 
   - Add these to **Production**, **Preview**, and **Development** environments
   - After deployment, update `NEXT_PUBLIC_SITE_URL` with your actual Vercel URL

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts and add environment variables when asked
```

---

## ✅ Post-Deployment Checklist

After deployment, verify everything works:

### 1. **Test Homepage**
- [ ] Visit your deployed URL
- [ ] Check if page loads correctly
- [ ] Test file upload functionality
- [ ] Verify dark/light mode toggle works

### 2. **Test Authentication**
- [ ] Click "Join Free" button
- [ ] Register a new account with test email
- [ ] Verify registration success
- [ ] Log in with credentials
- [ ] Test logout functionality
- [ ] Verify session persists on page reload

### 3. **Test File Processing**
- [ ] Upload a test image (JPEG with EXIF data)
- [ ] Edit metadata fields
- [ ] Download processed file
- [ ] Download change log (.txt file)
- [ ] Verify metadata was actually modified

### 4. **Test Admin Dashboard**
- [ ] Login with admin account (email containing "admin")
- [ ] Access `/admin` route
- [ ] Verify stats display correctly
- [ ] Check users list
- [ ] Test feedback management
- [ ] View analytics events

### 5. **Test Analytics**
- [ ] Open browser DevTools → Network tab
- [ ] Perform actions (file upload, download, share)
- [ ] Verify `/api/analytics/track` requests succeed
- [ ] Check admin dashboard for new events

### 6. **Security Check**
- [ ] Try accessing `/admin` without authentication (should redirect to login)
- [ ] Try accessing `/admin` with non-admin account (should show forbidden)
- [ ] Verify `.env` file is not exposed
- [ ] Check that API routes require authentication where needed

---

## 🔍 Troubleshooting

### Issue: "Database connection failed"

**Solution:**
```bash
# Verify Turso credentials
turso db show filex-production

# Check if database exists
turso db list

# Regenerate auth token if expired
turso db tokens create filex-production
```

### Issue: "Authentication not working"

**Solution:**
1. Verify `BETTER_AUTH_SECRET` is set correctly
2. Check `NEXT_PUBLIC_SITE_URL` matches your domain
3. Clear browser cache and cookies
4. Redeploy with correct environment variables

### Issue: "Admin dashboard shows 403 Forbidden"

**Solution:**
- Ensure your email contains "admin" (e.g., `admin@example.com`)
- Or use the first registered account (has automatic admin rights)
- Check middleware.ts for route protection rules

### Issue: "Build fails on Vercel"

**Solution:**
```bash
# Test build locally first
npm run build

# If successful locally, check Vercel logs:
# - Go to Vercel Dashboard → Your Project → Deployments
# - Click on failed deployment
# - Read build logs for specific errors

# Common fixes:
# 1. Missing environment variables
# 2. TypeScript errors (fix with: npm run type-check)
# 3. ESLint errors (fix with: npm run lint)
```

### Issue: "File upload not working"

**Solution:**
- Check browser console for errors
- Verify file size is not too large (adjust limits if needed)
- Test with different file types (JPEG, PNG, PDF, MP3)
- Check CORS headers in vercel.json

---

## 🚀 Future Enhancements

### Easy Wins (Quick Implementation)

1. **Email Verification**
   - Add email service (SendGrid, Resend)
   - Enable email verification in better-auth
   - Send welcome emails to new users

2. **Social OAuth**
   - Add Google OAuth
   - Add GitHub OAuth
   - Configure OAuth providers in better-auth

3. **File Storage**
   - Integrate cloud storage (AWS S3, Cloudflare R2)
   - Store processed files temporarily
   - Add file history feature

4. **Analytics Dashboard**
   - Add charts and graphs (using recharts)
   - Show usage statistics
   - Export analytics data

### Advanced Features (Longer Implementation)

1. **Payment Integration (Stripe)**
   - Add premium plans
   - Batch file processing
   - Priority support
   - Advanced metadata fields

2. **API Key System**
   - Generate API keys for users
   - Public API for file processing
   - Rate limiting per API key
   - Usage tracking

3. **Mobile Apps**
   - iOS app (React Native)
   - Android app (React Native)
   - Offline processing capability
   - Camera integration

4. **Batch Processing**
   - Upload multiple files at once
   - Apply same metadata to all
   - Bulk download as ZIP
   - Progress tracking

5. **AI Features**
   - Auto-generate descriptions
   - Smart tagging
   - Image recognition
   - Content categorization

6. **Collaboration**
   - Team workspaces
   - Share files with team
   - Role-based permissions
   - Activity logs

---

## 📞 Need Help?

### Resources

- **Next.js Docs:** [https://nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Docs:** [https://vercel.com/docs](https://vercel.com/docs)
- **Turso Docs:** [https://docs.turso.tech](https://docs.turso.tech)
- **Better Auth Docs:** [https://www.better-auth.com/docs](https://www.better-auth.com/docs)

### Support

- Email: contact@knimex.space
- GitHub Issues: [Your Repository Issues]
- Discord: [Your Discord Server]

---

## 📝 Deployment Checklist Summary

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Test authentication flow
- [ ] Test file processing
- [ ] Test admin dashboard
- [ ] Security audit completed
- [ ] Error boundaries working
- [ ] Analytics tracking verified
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic on Vercel)

---

## 🎉 Congratulations!

Your FileX application is now live and ready for users worldwide! 🌍

Remember to:
- Monitor Vercel analytics for performance
- Check Turso dashboard for database usage
- Review user feedback regularly
- Keep dependencies updated
- Back up your database regularly

**Happy deploying! 🚀**

---

*Last updated: November 2025*
*FileX by KNIMEX Team*
