# Mister OS — Deployment Guide

Everything you need to deploy and update Mister OS is inside this `deploy_scripts/` folder.

## Scripts Overview

| Script | When to use |
|---|---|
| `setup_vps.sh` | **Once**, when setting up a brand new VPS |
| `redeploy.sh` | When you change **both** frontend and backend code |
| `redeploy_backend.sh` | When you **only** change Python backend code |
| `redeploy_frontend.sh` | When you **only** change React frontend code |

> **Tip:** If you only touched `.py` files → run `redeploy_backend.sh`. Only touched `.jsx`/`.js` files → run `redeploy_frontend.sh`. Touched both → run `redeploy.sh`.

---

## First-Time VPS Setup

### Step 1: Run the setup script
```bash
chmod +x deploy_scripts/setup_vps.sh
sudo bash deploy_scripts/setup_vps.sh
```
This checks for and installs Nginx, Python, and the Vercel CLI.

### Step 2: Set up the Python virtual environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Configure the systemd service
1. Copy the template:
   ```bash
   sudo cp deploy_scripts/mister_os_backend.service.template /etc/systemd/system/mister_os_backend.service
   ```
2. Edit it to match your VPS username and project path:
   ```bash
   sudo nano /etc/systemd/system/mister_os_backend.service
   ```
3. Enable and start it:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable mister_os_backend
   sudo systemctl start mister_os_backend
   ```

### Step 4: Configure Nginx
1. Copy the template:
   ```bash
   sudo cp deploy_scripts/nginx_api.conf.template /etc/nginx/sites-available/api.yourdomain.com
   ```
2. Edit the `server_name` to your actual subdomain:
   ```bash
   sudo nano /etc/nginx/sites-available/api.yourdomain.com
   ```
3. Enable the config and reload Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
   sudo systemctl reload nginx
   ```
4. Get a free SSL/HTTPS certificate via Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Step 5: Connect to Vercel
From inside your project's `frontend/` directory, log in and link the project:
```bash
cd frontend
vercel login
vercel link
```
Follow the prompts. After this, `redeploy_frontend.sh` will automatically push to your live Vercel URL every time.

---

## Useful Commands
```bash
# Check if backend is running
sudo systemctl status mister_os_backend

# View backend logs live
sudo journalctl -u mister_os_backend -f

# Restart backend manually
sudo systemctl restart mister_os_backend
```
