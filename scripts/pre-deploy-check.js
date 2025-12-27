/**
 * FileX Pre-Deployment Validation Protocol (Mega Prompt 8)
 * 
 * This script performs a comprehensive sanity check of the application 
 * before it is released to production. It covers environment, database, 
 * auth, and core utility health.
 * 
 * Usage: node scripts/pre-deploy-check.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function pass(msg) { console.log(`${colors.green}  ✓${colors.reset} ${msg}`); }
function fail(msg) { console.log(`${colors.red}  ✗${colors.reset} ${msg}`); }
function warn(msg) { console.log(`${colors.yellow}  !${colors.reset} ${msg}`); }
function info(msg) { console.log(`${colors.blue}  ℹ${colors.reset} ${msg}`); }
function section(msg) { console.log(`\n${colors.cyan}=== ${msg.toUpperCase()} ===${colors.reset}`); }

async function runValidation() {
  console.log(`\n${colors.magenta}🚀 FILEX PRE-DEPLOYMENT SANITY CHECK${colors.reset}`);
  console.log(`${colors.slate}Protocol Version: 1.0.0 (Mega Prompt 8)${colors.reset}\n`);

  let errorCount = 0;
  let warningCount = 0;

  // SECTION 1: Environment Variables
  section('Environment Configuration');
  const criticalEnvVars = [
    'TURSO_CONNECTION_URL',
    'TURSO_AUTH_TOKEN',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'NEXT_PUBLIC_SITE_URL'
  ];

  criticalEnvVars.forEach(v => {
    if (process.env[v]) {
      pass(`${v} is configured`);
    } else {
      warn(`${v} is missing in current environment`);
      warningCount++;
    }
  });

  // SECTION 2: Database Connectivity
  section('Database Integrity');
  try {
    const { createClient } = require('@libsql/client');
    const url = process.env.TURSO_CONNECTION_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (url && authToken) {
      const client = createClient({ url, authToken });
      await client.execute('SELECT 1');
      pass('Turso/LibSQL connection verified');
    } else {
      warn('Database credentials missing - skipping live check');
      warningCount++;
    }
  } catch (err) {
    fail(`Database connection failed: ${err.message}`);
    errorCount++;
  }

  // SECTION 3: Build Manifest & File Structure
  section('Build Manifest & Structure');
  const criticalDirs = ['src/app', 'src/components', 'src/lib', 'public', 'scripts'];
  criticalDirs.forEach(dir => {
    if (fs.existsSync(path.join(process.cwd(), dir))) {
      pass(`Directory verified: ${dir}`);
    } else {
      fail(`Missing critical directory: ${dir}`);
      errorCount++;
    }
  });

  const criticalFiles = ['package.json', 'tsconfig.json', 'next.config.ts', 'middleware.ts'];
  criticalFiles.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      pass(`File verified: ${file}`);
    } else {
      fail(`Missing critical file: ${file}`);
      errorCount++;
    }
  });

  // SECTION 4: Dependency Check
  section('Dependency Audit');
  const pkg = require('../package.json');
  const criticalDeps = ['framer-motion', 'jszip', 'jspdf', 'better-auth', 'drizzle-orm', 'lucide-react'];
  criticalDeps.forEach(dep => {
    if (pkg.dependencies[dep]) {
      pass(`Dependency present: ${dep}`);
    } else {
      fail(`Missing critical dependency: ${dep}`);
      errorCount++;
    }
  });

  // SECTION 5: Security & Compliance
  section('Security & Legal');
  const legalPages = ['src/app/privacy/page.tsx', 'src/app/terms/page.tsx'];
  legalPages.forEach(page => {
    if (fs.existsSync(path.join(process.cwd(), page))) {
      pass(`Legal page found: ${page.replace('src/app/', '').replace('/page.tsx', '')}`);
    } else {
      warn(`Legal page missing: ${page}`);
      warningCount++;
    }
  });

  // FINAL VERDICT
  console.log(`\n${colors.cyan}${'-'.repeat(40)}${colors.reset}`);
  console.log(`${colors.magenta}FINAL VERDICT:${colors.reset}`);
  console.log(`${colors.green}  ✓ Successes: ${criticalEnvVars.length + criticalDirs.length + criticalFiles.length + criticalDeps.length - errorCount - warningCount}${colors.reset}`);
  console.log(`${colors.yellow}  ! Warnings: ${warningCount}${colors.reset}`);
  console.log(`${colors.red}  ✗ Errors: ${errorCount}${colors.reset}`);

  if (errorCount > 0) {
    console.log(`\n${colors.red}❌ VALIDATION FAILED. Deployment blocked until errors are resolved.${colors.reset}\n`);
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`\n${colors.yellow}⚠️ VALIDATION PASSED WITH WARNINGS. Proceed with caution.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.green}✅ VALIDATION SUCCESSFUL. System is ready for production.${colors.reset}\n`);
    process.exit(0);
  }
}

runValidation().catch(err => {
  console.error(`\n${colors.red}FATAL ERROR DURING VALIDATION:${colors.reset}`, err);
  process.exit(1);
});
