#!/bin/bash

# Restoration script for Foodie app backups
# This script restores backed-up pages and components while preserving new auth logic

set -e

echo "🔄 Starting backup restoration process..."

# Create backup of current state
echo "📦 Creating safety backup of current state..."
mkdir -p backups/current_state
cp -r app backups/current_state/app_current 2>/dev/null || true
cp -r src/components backups/current_state/components_current 2>/dev/null || true

# List of files to NEVER overwrite (new auth logic)
PROTECTED_FILES=(
    "src/contexts/AuthContext.tsx"
    "middleware.ts"
    "src/lib/api.ts"
)

echo "✅ Protected files (will NOT be overwritten):"
for file in "${PROTECTED_FILES[@]}"; do
    echo "   - $file"
done

# Restore app pages (except auth pages which we'll handle specially)
echo ""
echo "📄 Restoring app pages..."

# Copy all backup app files except login/register (we keep the new ones)
rsync -av --exclude='login' --exclude='register' --exclude='(auth)' \
    backups/app_backup/ app/ 2>/dev/null || true

# Restore the new auth pages structure
echo "🔐 Preserving new auth pages..."
mkdir -p app/(auth)
cp backups/current_state/app_current/\(auth\)/layout.tsx app/\(auth\)/ 2>/dev/null || true
cp backups/current_state/app_current/\(auth\)/login/page.tsx app/\(auth\)/login/ 2>/dev/null || true
cp backups/current_state/app_current/\(auth\)/register/page.tsx app/\(auth\)/register/ 2>/dev/null || true

# Restore components
echo "🎨 Restoring components..."
mkdir -p src/components
cp -r backups/components_backup/* src/components/ 2>/dev/null || true

# Keep the new BottomNav if it exists
if [ -f "backups/current_state/components_current/BottomNav.tsx" ]; then
    echo "✅ Keeping new BottomNav.tsx"
    cp backups/current_state/components_current/BottomNav.tsx src/components/ 2>/dev/null || true
fi

echo ""
echo "✅ Restoration complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Run: npm run lint"
echo "   2. Run: npm run build"
echo "   3. Run: npx playwright test"
echo "   4. Review any import errors"

