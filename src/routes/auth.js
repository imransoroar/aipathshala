const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sign, requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const exists = db.findOne('users', { email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ error: 'An account with this email already exists' });

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = db.insert('users', {
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    phone: phone ? String(phone).trim() : '',
    passwordHash,
    role: 'student',
    avatar: '',
    bio: '',
  });
  const token = sign(user);
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const user = db.findOne('users', { email: String(email).toLowerCase().trim() });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  const token = sign(user);
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PATCH /api/auth/me  (update own profile)
router.patch('/me', requireAuth, async (req, res) => {
  const { name, phone, bio, password } = req.body || {};
  const patch = {};
  if (name) patch.name = String(name).trim();
  if (phone !== undefined) patch.phone = String(phone).trim();
  if (bio !== undefined) patch.bio = String(bio).trim();
  if (password) {
    if (String(password).length < 6) return res.status(400).json({ error: 'Password too short' });
    patch.passwordHash = await bcrypt.hash(String(password), 10);
  }
  const updated = db.update('users', req.user.id, patch);
  res.json({ user: publicUser(updated) });
});

module.exports = router;
module.exports.publicUser = publicUser;
