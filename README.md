# Jewell Haven — Full Deployment & Server Docs

This README documents everything you need to set up, build, run, and access the Jewell Haven app (React + Vite frontend, Express backend) on a Contabo Ubuntu 24.04 LTS server. It covers server preparation, database (Postgres) setup, building with Bun, running with PM2, configuration (env variables), and common troubleshooting.

Table of contents
- Project overview
- Assumptions
- Requirements
- Quick environment summary (example .env)
- Server setup (Ubuntu 24.04)
  - System updates and user
  - Install required runtimes (Node, Bun, PM2)
  - Firewall (UFW) and ports
  - Optional: Nginx reverse proxy & SSL
- Database (Postgres) setup
  - Local Postgres install (or remote connection)
  - Create DB and user
  - Prisma notes (db:push)
- Build steps (frontend & backend) — using Bun
- Running the app with PM2
  - Option A: Serve frontend via backend (recommended)
  - Option B: Serve frontend with Nginx and API on separate port
  - PM2 ecosystem example
- Accessing the app
- Log management & monitoring
- Backups & maintenance
- Environment variables reference
- Troubleshooting
- Appendix: useful commands

---

Project overview
- Frontend: React + Vite (built into static assets)
- Backend: Express (TypeScript)
- Package manager & build runtime: Bun
- Process manager: PM2
- Database: PostgreSQL
- Integrations:
  - Payment: mpesapi.giftedtech.co.ke
  - Email: jewell-mailer.giftedtech.co.ke
  - SMS: sms.ots.co.ke

Assumptions
- You have a Contabo server running Ubuntu 24.04 LTS (8GB RAM, 150GB SSD).
- You have SSH access to that server (root or sudo user).
- You own the repo and will copy code to the server (via git clone or CI/CD).
- The repo contains a `frontend/` (Vite) and `backend/` (Express) layout; adjust paths to match your repo.
- Your backend is TypeScript and has a build script (bun run build) that outputs JS to `dist/` (adjust if different).
- You use Prisma or another ORM; your mention of `bun run db:push` implies Prisma — instructions below assume Prisma.

Requirements (server-side)
- Ubuntu 24.04 LTS
- Git
- Bun (for building)
- Node.js (for PM2 installation; you can use Node 18/20)
- PM2
- PostgreSQL (local) or an externally hosted Postgres instance (set DATABASE_URL accordingly)
- Optional: Nginx, certbot (for SSL)

Quick .env example (create a `.env` in `backend/` — DO NOT commit secrets)
```env
# backend/.env
NODE_ENV=production
PORT=4000                          # app_port used to access serverip:app_port
DATABASE_URL=postgresql://dbuser:StrongPassword@localhost:5432/jewell_db
JWT_SECRET=super-secret-key
MPESA_API_URL=https://mpesapi.giftedtech.co.ke
MPESA_API_KEY=your_mpesa_key_here
MAILER_API_URL=https://jewell-mailer.giftedtech.co.ke
MAILER_API_KEY=your_mailer_key_here
SMS_API_URL=https://sms.ots.co.ke
SMS_API_KEY=your_sms_key_here
FRONTEND_DIST_PATH=../frontend/dist # adjust if different
```

Server setup (Ubuntu 24.04)
1. Connect to your server:
   - ssh youruser@SERVER_IP

2. Update & basic tools:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget build-essential ca-certificates
```

3. Add a non-root user (recommended):
```bash
sudo adduser deployer
sudo usermod -aG sudo deployer
# then login as deployer:
# ssh deployer@SERVER_IP
```

Install runtimes

4. Install Node.js (for PM2 installation and common tools)
- Using NodeSource (example installs Node 20):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

5. Install PM2 globally (via npm):
```bash
sudo npm install -g pm2
pm2 -v
```

6. Install Bun (for dependency install & build)
- Official install script (recommended):
```bash
curl -fsSL https://bun.sh/install | bash
# Follow the printed instructions to add bun to PATH (usually ~/.bun/bin)
# Example:
export PATH="$HOME/.bun/bin:$PATH"
# Verify:
bun -v
```

Note: Bun and Node can coexist. We'll use Bun for installing dependencies & building, and PM2 (Node) to run built JS. This avoids PM2 compatibility issues with Bun runtime.

Firewall (UFW)
7. Configure UFW:
```bash
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 4000/tcp    # replace 4000 with your app PORT (PORT in .env)
# If you plan to use nginx:
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Optional: Nginx reverse proxy & SSL
- If you want to serve the frontend on ports 80/443 and proxy API to the backend: install nginx and certbot, create a server block, and proxy pass /api to http://localhost:4000. See "Option B" below for example config.

Database (Postgres) setup
You can either run Postgres on the same server or use a managed/remote DB. If you are running Postgres locally:

8. Install Postgres:
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo -u postgres psql
```

9. Create DB and user (example):
Inside psql:
```sql
CREATE USER jewell_user WITH PASSWORD 'StrongPassword';
CREATE DATABASE jewell_db OWNER jewell_user;
GRANT ALL PRIVILEGES ON DATABASE jewell_db TO jewell_user;
\q
```

10. Allow remote connections (if needed)
- Edit `/etc/postgresql/*/main/pg_hba.conf` and `/etc/postgresql/*/main/postgresql.conf` to set `listen_addresses = '*'` then add client CIDR entries to pg_hba.conf, restart postgresql:
```bash
sudo systemctl restart postgresql
```

Prisma / migrations
- If you use Prisma, set `DATABASE_URL` in your backend `.env` then run:
```bash
# from backend/ (and after installing dependencies)
bun run db:push           # or `bun run migrate deploy` depending on workflow
bun run generate          # prisma generate, if present
```

Build steps (frontend & backend)
The steps below assume a repo structure with `frontend/` and `backend/` directories. Adjust to your actual structure.

1. Clone repo on server (or pull CI artifacts):
```bash
cd /var/www
git clone https://github.com/mussacco/jewell-haven.git
cd jewell-haven
```

2. Install dependencies and build frontend:
```bash
# Frontend
cd frontend
bun install
# Build static assets
bun run build
# This produces `dist/` or `build/` depending on your Vite config
# Note the path to the built frontend - used below
```

3. Install backend deps, push DB schema, build
```bash
cd ../backend
bun install
# Push schema to database (Prisma)
bun run db:push
# Build backend (TypeScript -> JS) : adjust to your project's build script
bun run build
# Expected output: backend/dist or similar
```

Serve the frontend with the backend (recommended)
- Many Express apps serve static files. The flow:
  - Build frontend to `frontend/dist`
  - Copy `frontend/dist/*` into `backend/public` (or point Express static to frontend/dist)
  - Start the backend (which now serves both API and static) on `PORT` in `.env`.
- Example copy:
```bash
rm -rf backend/public/*
cp -r frontend/dist/* backend/public/
```
- In Express:
```js
// Example snippet (backend):
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

Running the app with PM2
Approach used here: build backend into pure Node JS (dist), then let PM2 run the built JS using Node (robust and compatible).

1. Prepare `.env` in backend (don't commit):
```bash
# cd backend
cp .env.example .env
# edit .env with proper values
nano .env
```

2. PM2 ecosystem file (example) — save as `backend/ecosystem.config.js`
```js
module.exports = {
  apps: [
    {
      name: "jewell-backend",
      script: "./dist/server.js", // replace with your built entry file
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 4000
        // other env are picked from backend/.env or you can list here
      }
    }
  ]
};
```
Adjust `script` to the actual built entrypoint (for example `dist/index.js` or `dist/server.js`).

3. Start with PM2
```bash
cd backend
# Start with ecosystem:
pm2 start ecosystem.config.js
# Or direct:
pm2 start dist/server.js --name jewell-backend
```

4. Make PM2 resurrect on reboot:
```bash
pm2 save
pm2 startup systemd -u youruser --hp /home/youruser
# follow the printed command from pm2 to finish enabling system boot
```

Alternative: Running Bun directly with PM2 (less tested)
- If you prefer running Bun directly in PM2, one approach is to run PM2 with an interpreter of bash and invoke `bun run start`:
```bash
pm2 start --name jewell-backend --interpreter bash -- -c "bun run start"
```
- This may work but the safer, more robust approach is to build to Node-compatible JS and run with Node (above).

Option B — Serve frontend with Nginx (reverse proxy)
- Build frontend and place `frontend/dist/` in `/var/www/jewell-frontend`.
- Nginx server block example (adjust domain or use server IP):
```
server {
    listen 80;
    server_name _; # or your domain
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
- After enabling, restart nginx:
```bash
sudo systemctl restart nginx
```

Accessing the app
- If using the backend to serve frontend: open
  - http://SERVER_IP:PORT (e.g. http://203.0.113.10:4000)
- If using Nginx with port 80/443 and domain: open domain or `http://SERVER_IP/`
- Ensure the port in `.env` is the same `PORT` you opened in UFW.

Log management & monitoring
- Tail logs:
```bash
pm2 logs jewell-backend
```
- Check app status:
```bash
pm2 status
pm2 monit
```
- View startup script:
```bash
pm2 startup
pm2 save
```

Backups & maintenance
- Postgres backup:
```bash
# Dump
pg_dump -U jewell_user -h localhost -Fc jewell_db > /backups/jewell_db_$(date +%F).dump
# Restore
pg_restore -U jewell_user -d jewell_db /backups/jewell_db_2026-01-01.dump
```
- Regularly `git pull` and `bun install` then build & restart via PM2:
```bash
git pull
bun install
bun run build         # build backend
bun run build --cwd ../frontend  # example - adjust to your scripts
pm2 restart jewell-backend
```

Environment variables reference (full)
- NODE_ENV — production/development
- PORT — backend port to listen on
- DATABASE_URL — PostgreSQL connection string (postgresql://user:pass@host:port/db)
- JWT_SECRET — signing key for auth tokens
- MPESA_API_URL — https://mpesapi.giftedtech.co.ke
- MPESA_API_KEY — (if required)
- MAILER_API_URL — https://jewell-mailer.giftedtech.co.ke
- MAILER_API_KEY — (if required)
- SMS_API_URL — https://sms.ots.co.ke
- SMS_API_KEY — (if required)
- FRONTEND_DIST_PATH — path where frontend built assets are copied or served from

Troubleshooting
- App crash on PM2 start: `pm2 logs` to see error stack. Common issues:
  - Wrong `script` path in ecosystem.config.js
  - Missing environment variables (e.g. DATABASE_URL)
  - DB not reachable — check `psql` connection and `pg_hba.conf`
- Bun build errors: ensure Node/Bun versions are compatible with your code and dependencies. Update or pin Bun if needed.
- CORS issues: if frontend served from a different origin, enable CORS in Express:
```js
import cors from "cors";
app.use(cors({ origin: "http://yourfrontend.com" })); // or '*'
```
- Port conflicts: check `ss -tulpn | grep :4000`

Appendix — useful commands summary
- Update server:
  - sudo apt update && sudo apt upgrade -y
- Install bun:
  - curl -fsSL https://bun.sh/install | bash
- Build frontend:
  - cd frontend && bun install && bun run build
- Build backend:
  - cd backend && bun install && bun run build && bun run db:push
- Start backend with PM2:
  - cd backend && pm2 start dist/server.js --name jewell-backend
- PM2 management:
  - pm2 status
  - pm2 logs jewell-backend
  - pm2 restart jewell-backend
  - pm2 save
  - pm2 startup

Security recommendations
- Never commit `.env` or secrets to git.
- Use strong DB credentials and restrict Postgres remote access to required hosts/IPs.
- Use HTTPS in production — use Nginx + certbot for Let’s Encrypt.
- Limit SSH access (use key-based auth, disable password login).

If something in this README does not match your repo structure or build scripts (for example different build output paths, names, or script names), tell me the exact script names and folder layout (paths for the frontend build output and the backend build output / entrypoint) and I will update the README and provide an adjusted `ecosystem.config.js` and Nginx server block that match your project exactly.
