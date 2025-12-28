#!/bin/bash

echo "🔍 Checking for .env in Git tracking..."

if git ls-files | grep -q "^\.env$"; then
  echo "❌ CRITICAL: .env is tracked by Git!"
  echo ""
  echo "Removing .env from Git tracking..."
  git rm --cached .env
  git commit -m "security: remove .env from version control [CRITICAL FIX]"
  echo ""
  echo "⚠️  WARNING: .env was in Git history. Assume all credentials are compromised."
  echo "You MUST rotate these credentials:"
  echo "  - SUPABASE_SERVICE_ROLE_KEY"
  echo "  - BETTER_AUTH_SECRET"
  echo "  - CRON_SECRET"
  echo ""
  echo "Generate new credentials:"
  echo "  CRON_SECRET: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  echo "  BETTER_AUTH_SECRET: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
  echo ""
else
  echo "✅ .env is not tracked by Git (safe)"
fi

echo ""
echo "Verifying .gitignore contains .env patterns..."
if grep -q "^\.env$" .gitignore 2>/dev/null; then
  echo "✅ .gitignore properly configured"
else
  echo "⚠️  Adding .env to .gitignore"
  echo "" >> .gitignore
  echo "# Environment variables" >> .gitignore
  echo ".env" >> .gitignore
  echo ".env*.local" >> .gitignore
  echo ".env.local" >> .gitignore
  echo ".env.development.local" >> .gitignore
  echo ".env.test.local" >> .gitignore
  echo ".env.production.local" >> .gitignore
  git add .gitignore
  git commit -m "fix: ensure .env is properly ignored"
fi

echo ""
echo "✅ Security check complete"
