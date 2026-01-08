# Jewell Haven — Full Deployment & Server Docs

This README documents how to set up, build, run, and access the Jewell Haven app (React + Vite frontend and Express TypeScript backend) on a Contabo Ubuntu 24.04 LTS server. The repo uses a single root `package.json` and a shared `.env`. It uses Bun for installs/build and PM2 to run the built Node output. Database push uses drizzle-kit.

Table of contents
- [Project overview](#project-overview)
- [Superadmin notice (IMPORTANT)](#superadmin-notice-important)
- [Assumptions & repo layout](#assumptions--repo-layout)
- [Requirements](#requirements)
- [Quick .env (your sample)](#quick-env-your-sample)
- [Important code notes (scan results)](#important-code-notes-scan-results)
- [Server setup (Ubuntu 24.04)](#server-setup-ubuntu-24-04)
  - [System updates & user](#system-updates--user)
  - [Install Node, Bun, PM2](#install-node-bun-pm2)
  - [Firewall (UFW)](#firewall-ufw)
- [Database (Postgres) setup](#database-postgres-setup)
  - [drizzle-kit note (db:push)](#drizzle-kit-note-dbpush)
- [Build steps (shared package.json & Bun)](#build-steps-shared-packagejson--bun)
- [Serve frontend with backend (production)](#serve-frontend-with-backend-production)
- [Run with PM2 (production)](#run-with-pm2-production)
  - [ecosystem.config.js example](#ecosystemconfigjs-example)
- [Nginx reverse-proxy (optional)](#nginx-reverse-proxy-optional)
- [Accessing the app](#accessing-the-app)
- [Logs & monitoring](#logs--monitoring)
- [Backups & maintenance](#backups--maintenance)
- [Environment variables reference (your sample)](#environment-variables-reference-your-sample)
- [Security & CORS notes](#security--cors-notes)
- [Troubleshooting](#troubleshooting)
- [Appendix: useful commands](#appendix-useful-commands)

---

## Project overview
- Frontend: React + Vite
- Backend: Express (TypeScript)
- Single repository with a shared root `package.json` and shared `.env`.
- Build/runtime tools: Bun (install/build) and PM2 (process manager).
- DB: PostgreSQL (drizzle-kit schema push used)
- Integrations:
  - MPESA: https://mpesapi.giftedtech.co.ke
  - Email: jewell-mailer.giftedtech.co.ke (configure EMAIL_API_URL)
  - SMS: sms.ots.co.ke

## Superadmin notice (IMPORTANT)
**First registered user becomes superadmin:** The application automatically assigns the first account that registers the "superadmin" role with full control (user & site management). Ensure the first account is created by a trusted operator. If you want different behavior, update registration logic before deploying.

## Assumptions & repo layout
- Single root `package.json` controls both frontend & backend scripts.
- Backend source entry: `server/index.ts` (dev) → built file `dist/index.cjs` (start).
- You keep environment variables in the repo root `.env` (shared).
- The repository contains frontend sources (Vite) and `server/` for the backend.

## Requirements
- Ubuntu 24.04 LTS (your Contabo VM)
- Git
- Bun
- Node.js (for PM2 and Node runtime)
- PM2
- PostgreSQL
- Optional: Nginx + certbot for TLS

## Quick .env (your sample)
Create a root `.env` (DO NOT commit secrets). Use this exact set you provided:

```env
PORT=3432
PGPORT=
PGUSER=
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

Notes:
- If you set `DATABASE_URL` you do not need the individual PG vars; drizzle-kit and most DB libs prefer `DATABASE_URL`.
- `PORT` is the port server listens on (server/index.ts defaults to PORT or 5000). Set to `3432` per your sample.

## Important code notes (scan results)
I inspected:
- Root package.json scripts: `dev` (`tsx server/index.ts`), `build` (`tsx script/build.ts`), `start` (`node dist/index.cjs`), `check` (`tsc`), `db:push` (`drizzle-kit push`). See file: https://github.com/mussacco/jewell-haven/blob/b4e5b71c08423998f53f390016c7b2ca1fefa2ff/package.json
- Backend dev entry: `server/index.ts` (strict CORS domain, production serves static assets via `serveStatic`, listens on env PORT): https://github.com/mussacco/jewell-haven/blob/b4e5b71c08423998f53f390016c7b2ca1fefa2ff/server/index.ts

Keep in mind the scan may be incomplete. To inspect other repo files, visit: https://github.com/mussacco/jewell-haven

## Server setup (Ubuntu 24.04)
SSH and initial packages:
```bash
ssh youruser@SERVER_IP
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget build-essential ca-certificates ufw
```

Create a deploy user:
```bash
sudo adduser deployer
sudo usermod -aG sudo deployer
# then ssh deployer@SERVER_IP
```

### Install Node, Bun, PM2
Install Node (needed for PM2 and Node runtime):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```

Install PM2:
```bash
sudo npm install -g pm2
pm2 -v
```

Install Bun (for installs/builds):
```bash
curl -fsSL https://bun.sh/install | bash
# then add to PATH per the install output:
export PATH="$HOME/.bun/bin:$PATH"
bun -v
```

### Firewall (UFW)
Allow SSH and the app port:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 3432/tcp   # use PORT value from .env
sudo ufw enable
sudo ufw status
```

## Database (Postgres) setup
Install and start Postgres (if running locally):
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo -u postgres psql
```

Create DB & user:
```sql
CREATE USER jewell_user WITH PASSWORD 'StrongPassword';
CREATE DATABASE jewell_db OWNER jewell_user;
GRANT ALL PRIVILEGES ON DATABASE jewell_db TO jewell_user;
\q
```

### drizzle-kit note (db:push)
The repo uses `drizzle-kit push` (see package.json). Use your `.env` DATABASE_URL or PG* variables then:
```bash
# run from repo root
bun run db:push
```

## Build steps (shared package.json & Bun)
1. Clone the repo:
```bash
cd /var/www
git clone https://github.com/mussacco/jewell-haven.git
cd jewell-haven
```

2. Install dependencies with Bun:
```bash
bun install
```
Bun reads root package.json and will install packages used by both frontend and backend.

3. Build the project:
```bash
# This runs your build script: tsx script/build.ts
bun run build
```
- The repo's start script expects a built file at `dist/index.cjs` (see `start` in package.json). Confirm `script/build.ts` outputs `dist/index.cjs`.

4. Database push (drizzle-kit):
```bash
bun run db:push
```

5. Dev mode:
```bash
# run backend in dev (tsx will execute server/index.ts)
bun run dev
```

## Serve frontend with backend (production)
server/index.ts uses `serveStatic(app)` in production. The static-serving helper should point to your built frontend assets. If your build outputs a `dist/` or other folder, ensure the `serveStatic` helper is configured to serve it. Alternatively, copy frontend build to a `public/` folder consumed by server:

```bash
# Example (adjust paths if different)
rm -rf server/public/*
cp -r path/to/frontend/dist/* server/public/
# then build backend and start
bun run build
```

## Run with PM2 (production)
Start the built Node file `dist/index.cjs` with PM2 (recommended):

Example direct start:
```bash
cd /var/www/jewell-haven
# ensure .env is present at repo root
pm2 start dist/index.cjs --name jewell-backend --node-args="--enable-source-maps"
pm2 save
pm2 startup systemd -u deployer --hp /home/deployer
# run the printed command to complete startup setup
```

### ecosystem.config.js example
Save this in repo root as `ecosystem.config.js` (adjust paths if necessary):

```js
module.exports = {
  apps: [
    {
      name: "jewell-backend",
      script: "./dist/index.cjs",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3432
      }
    }
  ]
};
```

Start with:
```bash
pm2 start ecosystem.config.js
pm2 save
```

## Nginx reverse-proxy (optional)
If you want to use port 80/443 with a domain and proxy API to backend:
- Build frontend to a folder (e.g., `/var/www/jewell-frontend`)
- Nginx serve static files and proxy `/api/` to `http://127.0.0.1:3432/`
- Use certbot for HTTPS if you have a domain

## Accessing the app
- If backend serves frontend: http://SERVER_IP:3432
- If using Nginx: http://SERVER_IP/ or https://yourdomain.com

## Logs & monitoring
```bash
pm2 logs jewell-backend
pm2 status
pm2 monit
```

## Backups & maintenance
Postgres dump:
```bash
pg_dump -U jewell_user -h localhost -Fc jewell_db > /backups/jewell_db_$(date +%F).dump
```
Restore with `pg_restore`.

Update workflow:
```bash
git pull
bun install
bun run build
bun run db:push
pm2 restart jewell-backend
```

## Environment variables reference (your sample)
- PORT — backend port (3432)
- PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE — individual Postgres settings
- DATABASE_URL — complete Postgres connection string (preferred)
- NODE_ENV — `production`/`development`
- JWT_SECRET — JWT signing key
- SESSION_SECRET — session signing key
- MPESA_API_URL — https://mpesapi.giftedtech.co.ke
- EMAIL_API_URL — mailer endpoint
- SMS_API_URL, SMS_API_TOKEN, SMS_SENDER_ID — SMS provider
- Other service keys — keep secret

## Security & CORS notes
- server/index.ts contains strict origin validation. By default it uses:
  - ALLOWED_DOMAIN / ALLOWED_ORIGIN = `https://jwl.giftedtech.co.ke`
- In production, the server will block modifying API requests (POST/PUT/PATCH/DELETE) from other origins. Update `server/index.ts` or set `NODE_ENV=development` only for local testing.
- Ensure the first user you register is trusted (superadmin).
- Do not commit `.env` to git.

## Troubleshooting
- If server refuses requests from your browser, check CORS origin and `ALLOWED_ORIGIN` in `server/index.ts`.
- If `dist/index.cjs` missing after build, inspect `script/build.ts` to confirm output path.
- Use `pm2 logs` and `pm2 status` to debug runtime errors.

## Appendix: useful commands
- Install deps: `bun install`
- Build project: `bun run build`
- DB push (drizzle-kit): `bun run db:push`
- Dev server: `bun run dev`
- Start with PM2: `pm2 start dist/index.cjs --name jewell-backend`

---

If you'd like I can:
- create a `.env.example` file in the repo with your sample env,
- add `ecosystem.config.js` into the repo with the correct entrypoint,
- or update `server/index.ts` docs and ALLOWED_ORIGIN to use an env var instead of the hard-coded domain.

Tell me which you'd like next and I will generate the file contents and a git-ready patch for you.
