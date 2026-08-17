#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', '.env.local');

function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
}

loadEnv(envPath);
loadEnv(envLocalPath);

const allowMissing = process.argv.includes('--allow-missing') || Boolean(process.env.CI || process.env.VERCEL);

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'CRON_SECRET'
];

const optional = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_APP_BASE_PATH',
  'CORS_ALLOWED_ORIGINS',
  'NODE_ENV',
  'DATABASE_POOL_MAX'
];

console.log('🔍 Validating Environment Variables...\n');

let missing = [];
let present = [];
let warnings = [];

// Check required
for (const key of required) {
  if (process.env[key]) {
    present.push(key);
    console.log(`✅ ${key}`);

    // Validate format
    if (key === 'NEXT_PUBLIC_SUPABASE_URL' && !process.env[key].startsWith('https://')) {
      warnings.push(`${key} should start with https://`);
    }
    if (key === 'DATABASE_URL' && !/^postgres(?:ql)?:\/\//.test(process.env[key])) {
      warnings.push(`${key} should use a PostgreSQL connection URL`);
    }
    if (key === 'BETTER_AUTH_URL') {
      try {
        const authUrl = new URL(process.env[key]);
        if (process.env.NODE_ENV === 'production' && authUrl.protocol !== 'https:') {
          warnings.push(`${key} should use https:// in production`);
        }
      } catch {
        warnings.push(`${key} is not a valid URL`);
      }
    }
    if (key === 'CRON_SECRET' && process.env[key].length < 32) {
      warnings.push(`${key} should be at least 32 characters`);
    }
  } else if (allowMissing) {
    console.log(`⚠️  ${key} - MISSING (allowed in CI shape-check mode)`);
  } else {
    missing.push(key);
    console.log(`❌ ${key} - MISSING`);
  }
}

// Check optional
console.log('');
for (const key of optional) {
  if (process.env[key]) {
    console.log(`ℹ️  ${key}: ${process.env[key]}`);
  } else {
    warnings.push(`${key} not set (optional but recommended)`);
  }
}

if (process.env.NEXT_PUBLIC_APP_BASE_PATH && !/^\/[a-z0-9-]+$/i.test(process.env.NEXT_PUBLIC_APP_BASE_PATH)) {
  warnings.push('NEXT_PUBLIC_APP_BASE_PATH should be a single slash-prefixed path such as /filex');
}

if (process.env.CORS_ALLOWED_ORIGINS?.split(',').some((origin) => origin.trim() === '*')) {
  warnings.push('CORS_ALLOWED_ORIGINS must not contain the wildcard *');
}

if (process.env.CORS_ALLOWED_ORIGINS) {
  for (const origin of process.env.CORS_ALLOWED_ORIGINS.split(',')) {
    try {
      const parsedOrigin = new URL(origin.trim());
      if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.pathname !== '/') {
        warnings.push(`CORS origin should be an origin URL without a path: ${origin.trim()}`);
      }
    } catch {
      warnings.push(`CORS origin is not a valid URL: ${origin.trim()}`);
    }
  }
}

if (process.env.DATABASE_POOL_MAX) {
  const poolSize = Number.parseInt(process.env.DATABASE_POOL_MAX, 10);
  if (!Number.isInteger(poolSize) || poolSize < 1 || poolSize > 10) {
    warnings.push('DATABASE_POOL_MAX must be an integer between 1 and 10');
  }
}

console.log('\n' + '='.repeat(60));

// Report warnings
if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(w => console.log(`   - ${w}`));
}

// Report results
if (missing.length > 0 && !allowMissing) {
  console.log(`\n❌ ${missing.length} required variable(s) missing:`);
  missing.forEach(key => console.log(`   - ${key}`));
  console.log('\nAdd to .env.local and Vercel environment variables.');
  console.log('\nGenerate secrets:');
  console.log('  CRON_SECRET: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.log('  BETTER_AUTH_SECRET: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
  process.exit(1);
} else {
  console.log(allowMissing
    ? '\n✅ Environment variable shape check passed (missing secrets allowed in CI/Vercel builds).'
    : '\n✅ All required environment variables present!');
  if (warnings.length === 0) {
    console.log('✅ No warnings!');
  }
  process.exit(0);
}
