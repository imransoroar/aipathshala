const path = require('path');
const express = require('express');
const config = require('./src/config');
const db = require('./src/db');
const { attachUser } = require('./src/middleware/auth');
const { seedIfEmpty } = require('./src/seed-core');

db.load();
seedIfEmpty(db); // auto-load demo data on first boot (empty DB only)

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(attachUser);

// API routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/courses', require('./src/routes/courses'));
app.use('/api/enrollments', require('./src/routes/enrollments'));
app.use('/api/payments', require('./src/routes/payments'));
app.use('/api/admin', require('./src/routes/admin'));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.get('/api/config', (req, res) => res.json({
  currency: config.currency,
  sandbox: config.payment.sandbox,
  gateways: ['bkash', 'nagad', 'sslcommerz'],
}));

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// JSON 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// SPA-ish fallback: serve index for non-file, non-api GETs
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || path.extname(req.path)) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(config.port, () => {
  console.log('AI Pathshala running on http://localhost:' + config.port);
  console.log('Payment mode:', config.payment.sandbox ? 'SANDBOX (simulated)' : 'LIVE');
});
