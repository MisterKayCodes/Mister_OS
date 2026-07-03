#!/bin/bash
# redeploy.sh - Run this when you change BOTH frontend and backend code.

set -e

echo "============================================="
echo "   Full Redeployment of Mister OS...         "
echo "============================================="

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[1/2] Redeploying Backend..."
bash "$SCRIPT_DIR/redeploy_backend.sh"

echo ""
echo "[2/2] Redeploying Frontend..."
bash "$SCRIPT_DIR/redeploy_frontend.sh"

echo "============================================="
echo "   Full Redeployment Complete! 🚀            "
echo "============================================="
