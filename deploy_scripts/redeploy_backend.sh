#!/bin/bash
# redeploy_backend.sh - Run this ONLY when you change Python backend code.

set -e

echo "============================================="
echo "   Restarting Mister OS Backend...           "
echo "============================================="

# Activate venv and reinstall deps (in case requirements changed)
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR/backend"

echo "[+] Installing/updating Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt --quiet

echo "[+] Restarting systemd service..."
sudo systemctl restart mister_os_backend

echo "[✓] Backend restarted! Checking status..."
sudo systemctl status mister_os_backend --no-pager

echo "============================================="
echo "   Backend Redeployment Complete! 🚀         "
echo "============================================="
