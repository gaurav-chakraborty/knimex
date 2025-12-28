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

console.log('🔍 Validating Environment Variables...\n');

let missing = [];
let present = [];

for (const key of required) {
  if (process.env[key]) {
    present.push(key);
    console.log(`✅ ${key}`);
  } else {
    missing.push(key);
    console.log(`❌ ${key} - MISSING`);
  }
}

console.log('\n' + '='.repeat(50));

if (missing.length > 0) {
  console.log(`\n❌ ${missing.length} required variable(s) missing:`);
  missing.forEach(key => console.log(`   - ${key}`));
  console.log('\nAdd to .env.local and Vercel environment variables.');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables present!');
  process.exit(0);
}
