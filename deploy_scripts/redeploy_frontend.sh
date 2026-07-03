#!/bin/bash
# redeploy_frontend.sh - Run this ONLY when you change React frontend code.

set -e

echo "============================================="
echo "   Rebuilding & Redeploying Frontend...      "
echo "============================================="

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR/frontend"

echo "[+] Installing npm dependencies..."
npm install

echo "[+] Building frontend for production..."
npm run build
echo "[✓] Build complete!"

echo "[+] Pushing to Vercel (production)..."
vercel --prod
echo "[✓] Live on Vercel!"

echo "============================================="
echo "   Frontend Redeployment Complete! 🚀        "
echo "============================================="
