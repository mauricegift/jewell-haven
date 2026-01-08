# Jewell Haven — Full Deployment & Server Docs

This README documents everything you need to set up, build, run, and access the Jewell Haven app (React + Vite frontend, Express backend) on a Contabo Ubuntu 24.04 LTS server. It covers server preparation, database (Postgres) setup, building with Bun, running with PM2, configuration (env variables), and common troubleshooting.

Table of contents
- [Project overview](#project-overview)
- [Assumptions](#assumptions)
- [Requirements](#requirements)
- [Quick .env example](#quick-env-example)
- [Server setup (Ubuntu 24.04)](#server-setup-ubuntu-2404)
  - [System updates and user](#system-updates-and-user)
  - [Install runtimes (Node, Bun, PM2)](#install-runtimes-node-bun-pm2)
  - [Firewall (UFW) and ports](#firewall-ufw-and-ports)
  - [Optional: Nginx reverse proxy & SSL](#optional-nginx-reverse-proxy--ssl)
- [Database (Postgres) setup](#database-postgres-setup)
  - [Install Postgres](#install-postgres)
  - [Create DB and user](#create-db-and-user)
  - [Allow remote connections (optional)](#allow-remote-connections-optional)
  - [Prisma & migrations](#prisma--migrations)
- [Build steps (frontend & backend)](#build-steps-frontend--backend)
- [Serve the frontend with the backend (recommended)](#serve-the-frontend-with-the-backend-recommended)
- [Running the app with PM2](#running-the-app-with-pm2)
  - [PM2 ecosystem example](#pm2-ecosystem-example)
  - [Run Bun directly with PM2 (alternative)](#run-bun-directly-with-pm2-alternative)
- [Option B — Serve frontend with Nginx (reverse proxy)](#option-b--serve-frontend-with-nginx-reverse-proxy)
- [Accessing the app](#accessing-the-app)
- [Log management & monitoring](#log-management--monitoring)
- [Backups & maintenance](#backups--maintenance)
- [Environment variables reference](#environment-variables-reference)
- [Troubleshooting](#troubleshooting)
- [Appendix: useful commands](#appendix-useful-commands)
- [Security recommendations](#security-recommendations)

---

## Project overview
- Frontend: React + Vite (built into static assets)
- Backend: Express (TypeScript)
- Package manager & build runtime: Bun
- Process manager: PM2
- Database: PostgreSQL
- Integrations:
  - Payment: mpesapi.giftedtech.co.ke
  - Email: jewell-mailer.giftedtech.co.ke
  - SMS: sms.ots.co.ke

## Assumptions
- You have a Contabo server running Ubuntu 24.04 LTS (8GB RAM, 150GB SSD).
- You have SSH access to that server (root or a sudo user).
- The repo contains `frontend/` (Vite) and `backend/` (Express) folders; adjust paths if different.
- Your backend has a build script (e.g. `bun run build`) that outputs JS to `dist/` (adjust if different).
- You use Prisma (the README references `bun run db:push`), but adapt if you use another ORM.

## Requirements
- Ubuntu 24.04 LTS
- Git
- Bun
- Node.js (for PM2)
- PM2
- PostgreSQL (local or remote)
- Optional: Nginx and certbot for SSL

## Quick .env example
Create `backend/.env` (DO NOT commit this file):
```env
PORT=3432
PGPORT=
PGUSER=n
SMS_SENDER_ID=
PGDATABASE=
NODE_ENV=
PGPASSWORD=
SMS_API_URL=
JWT_SECRET=
MPESA_API_URL=https://mpesapi.giftedtech.co.ke
EMAIL_API_URL=
SMS_API_TOKEN=
PGHOST=
SESSION_SECRET=
DATABASE_URL=
```

## Server setup (Ubuntu 24.04)
Follow these steps on your Contabo VM.

### System updates and user
1. SSH to server:
```bash
ssh youruser@SERVER_IP
```
2. Update system and install tools:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget build-essential ca-certificates
```
3. (Recommended) Add a non-root user:
```bash
sudo adduser deployer
sudo usermod -aG sudo deployer
# Then ssh deployer@SERVER_IP
```

### Install runtimes (Node, Bun, PM2)
- Install Node.js (example: Node 20):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```
- Install PM2 globally:
```bash
sudo npm install -g pm2
pm2 -v
```
- Install Bun:
```bash
curl -fsSL https://bun.sh/install | bash
# Add ~/.bun/bin to PATH, then:
bun -v
```
Notes: We'll use Bun for installs and builds, and run the built Node-compatible JS with PM2.

### Firewall (UFW) and ports
```bash
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 4000/tcp   # change 4000 to your PORT
# If using nginx:
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### Optional: Nginx reverse proxy & SSL
If you want port 80/443 with a domain name, install nginx and certbot and create a server block that proxies `/api` to your backend and serves the frontend static files. See the Nginx example below in [Option B — Serve frontend with Nginx (reverse proxy)](#option-b--serve-frontend-with-nginx-reverse-proxy).

## Database (Postgres) setup

### Install Postgres
On the server (if running locally):
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo -u postgres psql
```

### Create DB and user
Inside psql:
```sql
CREATE USER jewell_user WITH PASSWORD 'StrongPassword';
CREATE DATABASE jewell_db OWNER jewell_user;
GRANT ALL PRIVILEGES ON DATABASE jewell_db TO jewell_user;
\q
```

### Allow remote connections (optional)
If you need remote DB access, edit `/etc/postgresql/*/main/postgresql.conf` to set `listen_addresses = '*'` and add client CIDR entries to `pg_hba.conf`, then restart:
```bash
sudo systemctl restart postgresql
```

### Prisma & migrations
If you use Prisma:
1. Ensure `DATABASE_URL` is set in `backend/.env`.
2. From `backend/`:
```bash
bun run db:push       # or `bun run migrate deploy` depending on workflow
bun run generate      # if you have prisma generate
```

## Build steps (frontend & backend)
Assuming repo has `frontend/` and `backend/`:

1. Clone the repo:
```bash
cd /var/www
git clone https://github.com/mussacco/jewell-haven.git
cd jewell-haven
```

2. Frontend:
```bash
cd frontend
bun install
bun run build
# Result: frontend/dist/ (or Vite configured output)
```

3. Backend:
```bash
cd ../backend
bun install
bun run db:push
bun run build
# Result: backend/dist/ (JS ready for Node)
```

## Serve the frontend with the backend (recommended)
- Option: Have Express serve the built frontend static files.
- Copy built frontend into backend static folder:
```bash
rm -rf backend/public/*
cp -r ../frontend/dist/* backend/public/
```
- Example Express snippet:
```js
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

## Running the app with PM2
Build to Node-compatible JS and run with PM2 for robustness.

1. Ensure `backend/.env` exists and is configured.
2. Example PM2 ecosystem file (`backend/ecosystem.config.js`):
```js
module.exports = {
  apps: [
    {
      name: "jewell-backend",
      script: "./dist/server.js", // adjust to your built entry file
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    }
  ]
};
```
3. Start with PM2:
```bash
cd backend
pm2 start ecosystem.config.js
# or:
pm2 start dist/server.js --name jewell-backend
```
4. Make PM2 restart apps on reboot:
```bash
pm2 save
pm2 startup systemd -u youruser --hp /home/youruser
# Follow the printed command to complete setup
```

### PM2 ecosystem example
(See the example above — adjust `script` to your actual built entrypoint.)

### Run Bun directly with PM2 (alternative)
Less common and sometimes flaky. Example:
```bash
pm2 start --name jewell-backend --interpreter bash -- -c "bun run start"
```
Prefer building to Node JS and running with Node/PM2.

## Option B — Serve frontend with Nginx (reverse proxy)
1. Build frontend to `/var/www/jewell-frontend`:
```bash
cp -r frontend/dist /var/www/jewell-frontend
```
2. Nginx server block (example):
```
server {
    listen 80;
    server_name _; # replace with domain or use server IP
    root /var/www/jewell-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
3. Apply & restart nginx:
```bash
sudo systemctl restart nginx
```
4. Use certbot for HTTPS if you have a domain:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Accessing the app
- If backend serves frontend: open http://SERVER_IP:PORT (e.g. http://203.0.113.10:4000)
- If using Nginx with port 80/443: open http://SERVER_IP/ or https://yourdomain.com
- Confirm `PORT` in `.env` matches the port allowed in UFW.

## Log management & monitoring
- Tail logs:
```bash
pm2 logs jewell-backend
```
- Check status:
```bash
pm2 status
pm2 monit
```
- Save process list:
```bash
pm2 save
```

## Backups & maintenance
- Postgres dump:
```bash
pg_dump -U jewell_user -h localhost -Fc jewell_db > /backups/jewell_db_$(date +%F).dump
```
- Restore:
```bash
pg_restore -U jewell_user -d jewell_db /backups/jewell_db_2026-01-01.dump
```
- Typical update workflow:
```bash
git pull
bun install
# Rebuild frontend & backend
bun run build # in backend
(cd frontend && bun run build)
# Restart
pm2 restart jewell-backend
```

## Environment variables reference
- NODE_ENV — production/development
- PORT — backend port to listen on
- DATABASE_URL — PostgreSQL connection string
- JWT_SECRET — signing key for auth tokens
- MPESA_API_URL — https://mpesapi.giftedtech.co.ke
- MPESA_API_KEY — (if required)
- MAILER_API_URL — https://jewell-mailer.giftedtech.co.ke
- MAILER_API_KEY — (if required)
- SMS_API_URL — https://sms.ots.co.ke
- SMS_API_KEY — (if required)
- FRONTEND_DIST_PATH — path to built frontend assets

## Troubleshooting
- Use `pm2 logs` to inspect runtime errors.
- Common issues:
  - Wrong `script` path in PM2 ecosystem file.
  - Missing env vars (DATABASE_URL, JWT_SECRET).
  - DB connection errors — check Postgres status and `pg_hba.conf`.
  - CORS errors if frontend/api origins differ — add CORS middleware in Express.
- Example to enable CORS:
```js
import cors from 'cors';
app.use(cors({ origin: 'http://yourfrontend.com' })); // or '*'
```

## Appendix: useful commands
- Update server:
  - sudo apt update && sudo apt upgrade -y
- Install bun:
  - curl -fsSL https://bun.sh/install | bash
- Build frontend:
  - cd frontend && bun install && bun run build
- Build backend:
  - cd backend && bun install && bun run build && bun run db:push
- Start backend:
  - cd backend && pm2 start dist/server.js --name jewell-backend
- PM2 management:
  - pm2 status
  - pm2 logs jewell-backend
  - pm2 restart jewell-backend
  - pm2 save

## Security recommendations
- Never commit `.env` or secrets.
- Use strong DB passwords and restrict remote Postgres access to necessary IPs.
- Use HTTPS in production (Nginx + certbot).
- Harden SSH (key-based auth, disable password login) and limit allowed IPs if possible.

---

If your repo layout or script names differ (for example different build output paths or entrypoint filename), tell me the actual build output folder for frontend and the backend entrypoint file (e.g. `dist/index.js`), and I will update this README and provide an adjusted `ecosystem.config.js` and nginx server block that exactly match your project.
