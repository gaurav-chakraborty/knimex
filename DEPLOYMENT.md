# 🚀 Deployment Guide

Complete guide to deploy your FileX application to production using Vercel and Supabase.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Database Setup (Supabase)](#database-setup-supabase)
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
- ✅ A [Supabase](https://supabase.com) account (free tier available)
- ✅ Git installed and repository pushed to GitHub

---

## 🔐 Environment Variables

Your application requires these environment variables for production:

### Required Variables

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# Supabase Client
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication (better-auth)
BETTER_AUTH_SECRET=your-64-character-random-string
BETTER_AUTH_URL=https://your-domain.vercel.app

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### How to Generate BETTER_AUTH_SECRET

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project named `filex-production`
4. Save your database password securely

### Step 2: Get Connection Details

1. Go to **Project Settings** > **Database**
2. Copy the **Connection String** (Transaction mode recommended for Vercel)
3. Go to **Project Settings** > **API**
4. Copy the **Project URL**, **anon public key**, and **service_role secret**

### Step 3: Run Migrations

FileX uses Drizzle ORM. You can push your schema directly to Supabase:

```bash
# Ensure environment variables are set
npm run db:push
```

---

## 🚀 Vercel Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **New Project**
3. Import your `filex` repository
4. In **Environment Variables**, add all variables listed in the [Environment Variables](#environment-variables) section
5. Click **Deploy**

---

## 📋 Post-Deployment Checklist

- [ ] Verify database connection via the `/api/db-health` endpoint
- [ ] Test user registration and login
- [ ] Perform a test file upload and metadata removal
- [ ] Check Vercel Analytics and Speed Insights in the dashboard

---

## 🛠️ Troubleshooting

- **Database Connection Failures**: Ensure your `DATABASE_URL` uses the correct password and that Supabase allows connections from Vercel's IP ranges (or use the Supabase connection pooler).
- **Auth Redirect Issues**: Verify that `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` match your production domain.

---

## 🔮 Future Enhancements

- [ ] Integration with more IBM Watson AI services for advanced data classification.
- [ ] Batch processing for enterprise-level metadata management.
- [ ] Mobile application support (iOS/Android).
- [ ] Stripe integration for premium feature subscriptions.
