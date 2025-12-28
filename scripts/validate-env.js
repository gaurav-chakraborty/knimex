#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
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

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CRON_SECRET',
  'BETTER_AUTH_SECRET'
];

const optional = [
  'NEXT_PUBLIC_SITE_URL'
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
    if (key === 'CRON_SECRET' && process.env[key].length < 32) {
      warnings.push(`${key} should be at least 32 characters`);
    }
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

console.log('\n' + '='.repeat(60));

// Report warnings
if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(w => console.log(`   - ${w}`));
}

// Report results
if (missing.length > 0) {
  console.log(`\n❌ ${missing.length} required variable(s) missing:`);
  missing.forEach(key => console.log(`   - ${key}`));
  console.log('\nAdd to .env.local and Vercel environment variables.');
  console.log('\nGenerate secrets:');
  console.log('  CRON_SECRET: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.log('  BETTER_AUTH_SECRET: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables present!');
  if (warnings.length === 0) {
    console.log('✅ No warnings!');
  }
  process.exit(0);
}
