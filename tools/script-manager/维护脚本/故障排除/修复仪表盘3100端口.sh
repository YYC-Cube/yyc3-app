#!/bin/bash

echo "🔧 Fixing 3100 port Next.js dashboard syntax errors..."

# Kill any existing processes on port 3100
echo "🔄 Cleaning up existing processes..."
lsof -ti:3100 | xargs kill -9 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

echo "✅ Dashboard fix components created at:"
echo "   - /Users/yanyu/www/hooks/useAIAnalysis.ts"
echo "   - /Users/yanyu/www/hooks/useAuth.ts"
echo "   - /Users/yanyu/www/components/NotificationCenter.tsx"
echo "   - /Users/yanyu/www/components/PermissionGate.tsx"
echo "   - /Users/yanyu/www/components/ErrorBoundary.tsx"
echo "   - /Users/yanyu/www/DASHBOARD_FIXES.js"

echo ""
echo "📝 To complete the fix:"
echo "1. Add these imports to your dashboard.tsx:"
echo ""
echo "   import { useAIAnalysis } from '../hooks/useAIAnalysis';"
echo "   import { useAuth } from '../hooks/useAuth';"
echo "   import { NotificationCenter } from '../components/NotificationCenter';"
echo "   import { PermissionGate } from '../components/PermissionGate';"
echo "   import { ErrorBoundary } from '../components/ErrorBoundary';"
echo ""
echo "2. Restart your Next.js development server:"
echo "   pnpm dev --port 3100"
echo ""
echo "🎯 Components created and ready for import!"

# Create a quick import helper
cat << 'EOF' > /Users/yanyu/www/dashboard-import-helper.txt
// Add these imports to the top of your dashboard.tsx file
import { useAIAnalysis } from '../../hooks/useAIAnalysis';
import { useAuth } from '../../hooks/useAuth';
import { NotificationCenter } from '../../components/NotificationCenter';
import { PermissionGate } from '../../components/PermissionGate';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Make sure your dashboard is wrapped with ErrorBoundary
// And AuthProvider if not already present
EOF

echo "📄 Import helper created at: /Users/yanyu/www/dashboard-import-helper.txt"