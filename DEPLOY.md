# Deploying AI Pathshala (make it live)

The app auto-seeds demo data on first boot, so every option below is just
"install and start" — no manual setup step. Pick whichever host you prefer.

All hosts: after deploy, log in at `/login.html` with
`admin@aipathshala.com / admin123` and change the password.

---

## Option A — Render (free tier, no credit card)  ★ easiest
1. Put this folder in a GitHub repo (see "Push to GitHub" below).
2. Go to https://render.com → New → **Blueprint** → connect the repo.
   Render reads `render.yaml` and configures everything (build, start, secret).
3. Click **Apply**. In ~2 minutes you get a public URL like
   `https://aipathshala.onrender.com`.

> Free instances sleep after inactivity and the first request wakes them
> (~30s). `render.yaml` already attaches a 1 GB persistent disk so purchases/
> accounts survive restarts.

## Option B — Railway
1. Push to GitHub. 2. https://railway.app → New Project → Deploy from repo.
3. Railway auto-detects Node, runs `npm install` then `npm start`. Add a
   volume mounted at `/app/data` to persist data. Generate a domain → live.

## Option C — Fly.io (Docker, global)
```bash
fly launch --no-deploy        # uses the included Dockerfile
fly volumes create data --size 1
fly deploy
```
Set the mount to `/app/data` (a `[mounts]` block) so the database persists.

## Option D — Any VPS (DigitalOcean, Hetzner, AWS EC2)
```bash
git clone <your-repo> && cd aipathshala
npm install --production
JWT_SECRET=$(openssl rand -hex 32) PORT=3000 npm start
```
Put Nginx/Caddy in front for HTTPS and a custom domain.

## Option E — Docker anywhere
```bash
docker build -t aipathshala .
docker run -p 3000:3000 -e JWT_SECRET=$(openssl rand -hex 32) \
  -v $(pwd)/data:/app/data aipathshala
```

---

## Push to GitHub (needed for A & B)
```bash
cd aipathshala
git init && git add . && git commit -m "AI Pathshala"
git branch -M main
git remote add origin https://github.com/<you>/aipathshala.git
git push -u origin main
```

## Going live with real payments
The site runs in payment **sandbox** mode by default. To take real bKash/
Nagad/SSLCommerz payments, set `PAYMENT_SANDBOX=false` + the gateway
credentials in your host's environment variables, and complete the
`TODO (LIVE)` blocks in `src/gateways.js`. See README.md for details.

## Production checklist
- [ ] Set a strong `JWT_SECRET` (Render/Railway can auto-generate)
- [ ] Change the demo admin password after first login
- [ ] Attach a persistent disk/volume for `data/` (or migrate `src/db.js` to Postgres)
- [ ] Point your custom domain at the host and enable HTTPS
