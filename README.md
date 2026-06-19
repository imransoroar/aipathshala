# AI Pathshala (এআই পাঠশালা)

A complete, bilingual (বাংলা / English) online course platform — an LMS in the
style of Learning Bangladesh, built for **AI Pathshala**. Students can browse and
search courses, register/log in, buy courses through bKash / Nagad / SSLCommerz,
watch lessons in a course player with progress tracking, and leave reviews.
Admins get a full dashboard to manage courses, lessons, users and orders.

Built with **Node.js + Express** and a **zero-dependency JSON data store**, so it
runs anywhere with `npm install && npm start` — no database server, no build step,
no native compilation.

---

## Quick start

```bash
npm install        # install dependencies
npm run seed       # load demo courses + accounts (first run)
npm start          # start the server
```

Then open **http://localhost:3000**

### Demo accounts
| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@aipathshala.com    | admin123    |
| Student | student@aipathshala.com  | student123  |

> Language defaults to **Bangla**. Use the **EN / বাং** toggle in the top bar to switch.

---

## Features

**Students**
- Browse / search / filter courses by category, level and price; sort by popular/new/price
- Course detail page with curriculum, free **preview** lessons, ratings & reviews
- Register & log in (JWT auth, hashed passwords)
- Buy courses via **bKash, Nagad or SSLCommerz** (simulated in sandbox mode)
- Course player: video lessons, mark-complete, live progress bar, lifetime access
- "My Learning" dashboard + order/purchase history
- Leave a star rating + review on enrolled courses

**Admin**
- Dashboard: students, courses, enrollments, paid orders, total revenue
- Full course CRUD (bilingual fields, price/discount, thumbnail, tags, publish/draft, featured)
- Lesson management per course (video URL, duration, order, preview flag)
- User management (view, promote/demote admin)
- Orders table (who bought what, gateway, status)

**Platform**
- Bilingual UI (Bangla default + English), responsive (mobile/tablet/desktop)
- Role-based access control; secure-by-default (locked lesson videos unless enrolled)
- Atomic JSON persistence; swap-ready data layer for PostgreSQL/MySQL

---

## Project structure

```
aipathshala/
├── server.js              # Express app entry point
├── package.json
├── .env.example           # copy to .env to configure
├── data/db.json           # JSON database (auto-created by `npm run seed`)
├── src/
│   ├── config.js          # env config + payment credentials
│   ├── db.js              # JSON data store (find/insert/update/remove)
│   ├── gateways.js        # bKash / Nagad / SSLCommerz adapters (placeholders)
│   ├── seed.js            # demo data seeder
│   ├── middleware/auth.js # JWT auth + admin guard
│   └── routes/
│       ├── auth.js        # register / login / profile
│       ├── courses.js     # catalogue, detail, reviews
│       ├── enrollments.js # my courses, player, progress
│       ├── payments.js    # checkout / execute / orders
│       └── admin.js       # dashboard + management APIs
└── public/                # frontend (no build step)
    ├── index.html  courses.html  course.html
    ├── login.html  register.html  dashboard.html
    ├── checkout.html  learn.html  admin.html
    ├── css/styles.css
    └── js/  i18n.js  api.js  components.js  app.js
```

---

## Payments — sandbox vs going live

The app ships in **sandbox mode** (`PAYMENT_SANDBOX=true` in `.env`). In this mode
the checkout shows real bKash/Nagad/SSLCommerz options and runs the full purchase
journey, but **no real money moves** — payment is simulated and the course is granted.

To **go live**:
1. Copy `.env.example` to `.env`.
2. Set `PAYMENT_SANDBOX=false` and fill in credentials for the gateway(s) you use
   (e.g. `BKASH_ENABLED=true` + the bKash keys).
3. Implement the real API calls inside the clearly marked `TODO (LIVE)` blocks in
   **`src/gateways.js`**. Each adapter already documents the exact official endpoints
   to call for creating and verifying a payment:
   - **bKash** — Tokenized Checkout: grant token → create → execute
   - **Nagad** — initialize → complete → verify (RSA-signed payloads)
   - **SSLCommerz** — `gwprocess/v4/api.php` → redirect to GatewayPageURL → IPN validate

No frontend changes are needed — the same checkout flow drives both modes.

---

## Configuration (.env)

| Variable          | Default | Purpose                                  |
|-------------------|---------|------------------------------------------|
| `PORT`            | 3000    | HTTP port                                |
| `JWT_SECRET`      | dev key | **Change in production**                 |
| `JWT_EXPIRY`      | 7d      | Token lifetime                           |
| `CURRENCY`        | BDT     | Display currency                         |
| `PAYMENT_SANDBOX` | true    | `false` to use live gateways             |
| `DATA_DIR`        | ./data  | Where `db.json` is stored                |

See `.env.example` for the full list including all gateway keys.

---

## Deployment

Any Node host works (Render, Railway, a VPS, etc.):

```bash
npm install --production
npm run seed        # once, to initialise data (skip if you already have data/db.json)
NODE_ENV=production JWT_SECRET=your-long-random-secret npm start
```

Put it behind Nginx/Caddy for HTTPS. For higher traffic or multi-instance
deployments, replace `src/db.js` with a PostgreSQL/MySQL implementation — the route
handlers only use `db.find / findOne / findById / insert / update / remove`, so the
swap is localised to one file.

---

## API overview

```
POST   /api/auth/register            POST /api/auth/login        GET /api/auth/me
GET    /api/courses                  GET  /api/courses/:slug     GET /api/courses/categories
POST   /api/courses/:id/reviews
GET    /api/enrollments              GET  /api/enrollments/:courseId/player
POST   /api/enrollments/:courseId/complete
POST   /api/payments/checkout        POST /api/payments/execute  GET /api/payments/orders
GET    /api/admin/stats              CRUD /api/admin/courses     /api/admin/lessons
GET    /api/admin/users              GET  /api/admin/orders
```

---

© AI Pathshala. Built as a full-stack starter — MIT licensed.
