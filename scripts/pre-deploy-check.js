#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function section(title) {
  console.log(`\n${colors.cyan}=== ${title} ===${colors.reset}`);
}

function pass(msg) {
  console.log(`${colors.green}✓ ${msg}${colors.reset}`);
}

function fail(msg) {
  console.log(`${colors.red}✗ ${msg}${colors.reset}`);
}

function warn(msg) {
  console.log(`${colors.yellow}! ${msg}${colors.reset}`);
}

async function runValidation() {
  console.log(`${colors.magenta}🚀 Starting FileX Pre-Deployment Audit${colors.reset}`);
  console.log(`${colors.blue}Time: ${new Date().toISOString()}${colors.reset}\n`);

  let errorCount = 0;
  let warningCount = 0;

  // SECTION 1: Environment Validation
  section('Environment Validation');
  try {
    execSync('node scripts/validate-env.js', { stdio: 'inherit' });
    pass('Environment variables validated');
  } catch (err) {
    fail('Environment validation failed');
    errorCount++;
  }

  // SECTION 2: TypeScript Type Checking
  section('Type Consistency Check');
  try {
    console.log('Running tsc...');
    execSync('npm run type-check', { stdio: 'inherit' });
    pass('TypeScript types are consistent');
  } catch (err) {
    fail('TypeScript type checking failed');
    errorCount++;
  }

  // SECTION 3: Linting
  section('Code Quality Audit (Lint)');
  try {
    console.log('Running next lint...');
    execSync('npm run lint', { stdio: 'inherit' });
    pass('Linting passed');
  } catch (err) {
    fail('Linting failed');
    errorCount++;
  }

  // SECTION 4: Build Verification
  section('Production Build Verification');
  try {
    console.log('Running next build...');
    execSync('npm run build', { stdio: 'inherit' });
    pass('Production build successful');
  } catch (err) {
    fail('Production build failed');
    errorCount++;
  }

  // SECTION 5: Critical File Check
  section('File Integrity Check');
  const criticalFiles = [
    'next.config.mjs',
    'package.json',
    'src/db/schema.ts',
    'src/lib/auth.ts',
    'CONTRIBUTING.md',
    'CHANGELOG.md',
    'CODE_OF_CONDUCT.md'
  ];

  criticalFiles.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      pass(`Critical file verified: ${file}`);
    } else {
      fail(`Missing critical file: ${file}`);
      errorCount++;
    }
  });

  // FINAL VERDICT
  console.log(`\n${colors.cyan}${'-'.repeat(40)}${colors.reset}`);
  console.log(`${colors.magenta}FINAL VERDICT:${colors.reset}`);
  console.log(`${colors.green}  ✓ Errors: ${errorCount === 0 ? 'None' : errorCount}${colors.reset}`);
  console.log(`${colors.yellow}  ! Warnings: ${warningCount}${colors.reset}`);

  if (errorCount > 0) {
    console.log(`\n${colors.red}❌ PRE-DEPLOYMENT CHECK FAILED. Fix errors before deploying.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✅ PRE-DEPLOYMENT CHECK SUCCESSFUL. Ready for production!${colors.reset}\n`);
    process.exit(0);
  }
}

runValidation().catch(err => {
  console.error(`\n${colors.red}FATAL ERROR DURING PRE-DEPLOYMENT CHECK:${colors.reset}`, err);
  process.exit(1);
});
