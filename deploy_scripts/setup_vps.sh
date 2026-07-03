#!/bin/bash
# setup_vps.sh - Run this once on your VPS to set up the environment.

set -e

echo "============================================="
echo "   Mister OS - VPS Setup Script              "
echo "============================================="

# 1. Check and install Nginx
if ! command -v nginx &> /dev/null; then
    echo "[+] Nginx not found. Installing..."
    sudo apt update
    sudo apt install -y nginx
else
    echo "[✓] Nginx is already installed. Skipping."
fi

# 2. Check and install python3-venv
if ! dpkg -s python3-venv &> /dev/null; then
    echo "[+] python3-venv not found. Installing..."
    sudo apt update
    sudo apt install -y python3-venv python3-pip
else
    echo "[✓] python3-venv is already installed. Skipping."
fi

# 3. Check and install Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "[+] Vercel CLI not found. Installing via npm..."
    # Check if npm is installed first
    if ! command -v npm &> /dev/null; then
        echo "[+] npm not found. Installing Node.js and npm..."
        sudo apt update
        sudo apt install -y nodejs npm
    fi
    sudo npm install -g vercel
else
    echo "[✓] Vercel CLI is already installed. Skipping."
fi

echo "---------------------------------------------"
echo "System dependencies are ready!"
echo ""
echo "To finish setup, you need to:"
echo "1. Create your python virtual environment: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
echo "2. Copy the 'mister_os_backend.service.template' to '/etc/systemd/system/mister_os_backend.service', edit the paths, and run: sudo systemctl enable --now mister_os_backend"
echo "3. Copy the 'nginx_api.conf.template' to '/etc/nginx/sites-available/api.yourdomain.com', edit the domain, symlink to sites-enabled, and run: sudo systemctl reload nginx"
echo "============================================="
