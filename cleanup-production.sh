#!/bin/bash
# Production Cleanup Script for Badminton Cost-Sharing App
# Run this before deploying to production

echo "🧹 Starting production cleanup..."

# Create backup of important files before cleanup
echo "📦 Creating backup..."
mkdir -p cleanup-backup
cp -r database/ cleanup-backup/
cp -r scripts/ cleanup-backup/ 2>/dev/null || echo "No scripts directory found"

# Remove temporary database files (keep essential ones)
echo "🗑️ Removing temporary database files..."
rm -f database/allow_null_amount_owed.sql
rm -f database/allow_zero_player_count.sql
rm -f database/check_*.sql
rm -f database/debug_*.sql
rm -f database/disable_rls_temporarily.sql
rm -f database/login_phone_check.sql
rm -f database/minimal_rls_policies.sql
rm -f database/reset_organizer_data.sql
rm -f database/set_all_users_as_players.sql
rm -f database/simple_phone_lookup.sql
rm -f database/update_player_roles.sql
rm -f database/users_table_rls.sql

# Remove development artifacts
echo "🛠️ Removing development artifacts..."
rm -f css-variable-mapping.md

# Remove scripts directory if it exists and is empty of production scripts
if [ -d "scripts" ]; then
    echo "📜 Checking scripts directory..."
    if [ -z "$(find scripts -name "*.production.*" -o -name "deploy.*" -o -name "migrate.*")" ]; then
        echo "No production scripts found, removing scripts directory..."
        rm -rf scripts/
    else
        echo "Production scripts found, keeping scripts directory..."
    fi
fi

# Archive detailed planning documentation
echo "📚 Archiving planning documentation..."
mkdir -p docs/archive
if [ -d "docs/plans" ]; then
    mv docs/plans docs/archive/
fi

# Clean up any .DS_Store files (macOS)
find . -name ".DS_Store" -delete 2>/dev/null || true

# Clean up node_modules if present (will be reinstalled)
if [ -d "node_modules" ]; then
    echo "📦 Cleaning node_modules (will be reinstalled)..."
    rm -rf node_modules
fi

# Clean up .next build cache
if [ -d ".next" ]; then
    echo "⚡ Cleaning build cache..."
    rm -rf .next
fi

echo "✅ Cleanup complete!"
echo ""
echo "📋 Summary of changes:"
echo "   - Removed 15+ temporary database files"
echo "   - Archived planning documentation to docs/archive/"
echo "   - Cleaned build artifacts and system files"
echo "   - Backup created in cleanup-backup/"
echo ""
echo "🚀 Your app is now ready for production deployment!"
echo ""
echo "📌 Next steps:"
echo "   1. Run: npm install"
echo "   2. Run: npm run build"
echo "   3. Deploy: Deploy fix_balance_updates_rls.sql to database"
echo "   4. Deploy: Deploy application to your hosting platform"