#!/bin/bash

set -e  # Exit on error

echo "🚀 FileX Production Deployment"
echo "=============================="
echo ""

# Step 1: Security check
echo "Step 1/6: Security check..."
npm run security-check
echo ""

# Step 2: Validate environment
echo "Step 2/6: Validate environment..."
npm run validate-env
echo ""

# Step 3: Type check
echo "Step 3/6: TypeScript validation..."
npm run type-check
echo ""

# Step 4: Lint
echo "Step 4/6: ESLint check..."
npm run lint || echo "⚠️  Linting warnings (non-blocking)"
echo ""

# Step 5: Build
echo "Step 5/6: Production build..."
npm run build
echo ""

# Step 6: Git operations
echo "Step 6/6: Git commit and push..."
git add .
git status
echo ""
read -p "Commit message (or press Enter for default): " COMMIT_MSG
if [ -z "$COMMIT_MSG" ]; then
  COMMIT_MSG="feat: add health endpoints and keep-alive system for production deployment"
fi
git commit -m "$COMMIT_MSG" || echo "No changes to commit"
echo ""

# Display current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Push to current branch
echo "Pushing to origin/$CURRENT_BRANCH..."
git push -u origin "$CURRENT_BRANCH"
echo ""

echo "=============================="
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for Vercel to deploy"
echo "2. Run: npm run verify-deploy"
echo "3. Set up UptimeRobot (see UPTIMEROBOT_SETUP.md)"
echo "4. Run Supabase SQL setup (see scripts/supabase-setup.sql)"
echo "5. Complete POST_DEPLOYMENT.md checklist"
echo ""
echo "Your site: https://knimex.space"
echo "=============================="
