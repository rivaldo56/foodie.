#!/bin/bash

# Restore Original Foodie v2 Configuration
# This script reverts v0 changes and restores the original setup

echo "🔄 Restoring Original Foodie v2 Configuration..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup current v0 files
echo -e "${YELLOW}📦 Backing up v0 files...${NC}"
cp app/globals.css app/globals.css.v0-backup
cp package.json package.json.v0-backup
echo "   ✓ Backed up to *.v0-backup"
echo ""

# Restore original files
echo -e "${YELLOW}📝 Restoring original files...${NC}"
cp globals.css.original app/globals.css
cp package.json.original package.json
echo "   ✓ Restored app/globals.css"
echo "   ✓ Restored package.json"
echo ""

# Reinstall dependencies
echo -e "${YELLOW}📦 Reinstalling dependencies...${NC}"
echo "   This may take a few minutes..."
npm install
echo ""

# Clear Next.js cache
echo -e "${YELLOW}🧹 Clearing Next.js cache...${NC}"
rm -rf .next
echo "   ✓ Cache cleared"
echo ""

echo -e "${GREEN}✅ Restoration complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Original Foodie v2 Configuration Restored!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Changes made:"
echo "  ✓ Orange brand colors restored"
echo "  ✓ Minimal dependencies (7 packages)"
echo "  ✓ Line-clamp utilities restored"
echo "  ✓ Inter font configuration maintained"
echo ""
echo "v0 files backed up as:"
echo "  • app/globals.css.v0-backup"
echo "  • package.json.v0-backup"
echo ""
echo "To start the dev server:"
echo "  npm run dev"
echo ""
