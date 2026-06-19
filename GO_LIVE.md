# 🚀 Go Live — human runbook for AI Pathshala

This is the short, do-it-once checklist to put the site on the internet with a
real public URL and (optionally) accept real payments. No coding required.

The app **auto-seeds** demo data on first boot, so deployment is just "connect
and click deploy".

---

## PART 1 — Put the site online (≈10 minutes, free)

You'll use **GitHub** (to hold the code) + **Render** (to run it). Both have
free tiers with no credit card.

### Step 1 — Put the code on GitHub (no terminal needed)
1. Create a free account at https://github.com and click **New repository**.
   Name it `aipathshala`, keep it Public, click **Create repository**.
2. On the new repo page click **uploading an existing file**.
3. Unzip `aipathshala.zip` on your computer, then drag **all the files inside
   the `aipathshala` folder** into the upload box. Click **Commit changes**.

### Step 2 — Deploy on Render
1. Create a free account at https://render.com and choose **"Sign in with GitHub"**.
2. Click **New +** → **Blueprint**.
3. Select your `aipathshala` repository. Render reads `render.yaml` and fills in
   everything automatically. Click **Apply**.
4. Wait ~2 minutes. Render gives you a live URL like
   **`https://aipathshala.onrender.com`** — that's your site. 🎉

### Step 3 — First login
- Go to `https://YOUR-URL/login.html`
- Admin: `admin@aipathshala.com` / `admin123` → **change this password immediately**
  (top-right menu → profile), and create your real courses from the Admin panel.

> Note: Render's free plan sleeps after ~15 min idle; the next visitor wakes it
> (~30s). Upgrade to the cheapest paid plan to keep it always-on. The blueprint
> already adds a 1 GB disk so students/orders survive restarts.

---

## PART 2 — Accept REAL payments (SSLCommerz)  ← needs a human with a business

The site ships in **sandbox mode**: the full buy flow works but no real money
moves. SSLCommerz is recommended for Bangladesh — one integration accepts
**cards + bKash + Nagad + Rocket + bank**. The code is already written; you only
add credentials.

### What a human must do (Claude cannot — it requires your business identity):
1. **Open an SSLCommerz merchant account** at https://www.sslcommerz.com
   (requires a registered business: Trade License, TIN, bank account, NID).
   Approval typically takes a few business days.
2. After approval you'll get a **Store ID** and **Store Password** from the
   SSLCommerz merchant panel.
3. In Render → your service → **Environment**, add these variables:
   ```
   PAYMENT_SANDBOX = false
   SSLCZ_ENABLED   = true
   SSLCZ_SANDBOX   = false
   SSLCZ_STORE_ID       = <your store id>
   SSLCZ_STORE_PASSWORD = <your store password>
   APP_URL = https://YOUR-RENDER-URL
   ```
4. Click **Save** (Render redeploys). Done — checkout now takes real payments and
   automatically unlocks the course when payment succeeds.

### Test it before announcing
- First set `SSLCZ_SANDBOX = true` with your **sandbox** Store ID/Password
  (SSLCommerz gives separate sandbox credentials) and make a test purchase.
- When a test payment unlocks the course correctly, switch `SSLCZ_SANDBOX = false`
  with your live credentials.

### bKash / Nagad direct (optional)
SSLCommerz already routes bKash + Nagad, so most people don't need this. If you
want a **direct** bKash or Nagad integration (slightly lower fees), those require
separate merchant onboarding with bKash PGW / Nagad, and a developer to complete
the `TODO (LIVE)` blocks in `src/gateways.js`. Until then, leave those two in
sandbox and use SSLCommerz for live money.

---

## Quick reference
| Thing | Value |
|---|---|
| Live URL | from Render after deploy |
| Admin login | admin@aipathshala.com / admin123 (change it!) |
| Switch to real payments | set the env vars in PART 2 |
| Custom domain | Render → Settings → Custom Domains |

Questions a developer might need: see `README.md` (architecture/API) and
`DEPLOY.md` (other hosts: Railway, Fly, VPS, Docker).
