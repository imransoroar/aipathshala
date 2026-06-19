const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

function sign(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );
}

function getToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return null;
}

// Attaches req.user if a valid token is present (does not block).
function attachUser(req, _res, next) {
  const token = getToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const user = db.findById('users', payload.id);
      if (user) req.user = user;
    } catch (_e) { /* ignore invalid token */ }
  }
  next();
}

// Requires a logged-in user.
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

// Requires an admin user.
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

module.exports = { sign, attachUser, requireAuth, requireAdmin };
