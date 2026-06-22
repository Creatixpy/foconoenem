#!/bin/bash
set -e

echo "=== AprovIA - Dependency Upgrade Script ==="
echo ""

# Step 1: Stop any running dev server
echo "[1/5] Stopping any running dev servers..."
pkill -f "next dev" 2>/dev/null || true

# Step 2: Remove old lockfile and node_modules for clean install
echo "[2/5] Cleaning old installations..."
rm -rf node_modules package-lock.json

# Step 3: Update all dependency versions to latest using npm-check-updates
echo "[3/5] Checking latest versions with npm-check-updates..."
npx npm-check-updates@latest -u

# Step 4: Install all updated dependencies
echo "[4/5] Installing updated dependencies..."
npm install

# Step 5: Validate
echo "[5/5] Running lint check..."
npm run lint

echo ""
echo "=== Upgrade complete! ==="
echo "Next steps:"
echo "  1. Review the changes in package.json"
echo "  2. Run 'npm run build' to verify the build"
echo "  3. Run 'npm run dev' to test locally"
