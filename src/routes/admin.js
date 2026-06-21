const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { publicUser } = require('./auth');

const router = express.Router();
router.use(requireAdmin); // every route below requires admin

function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9ঀ-৿\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'course-' + Date.now();
}

// ---- Dashboard summary ----------------------------------------------------
router.get('/stats', (req, res) => {
  const orders = db.find('orders', { status: 'paid' });
  const revenue = orders.reduce((s, o) => s + (o.amount || 0), 0);
  const recentOrders = db.all('orders').sort((a, b) => b.id - a.id).slice(0, 8).map((o) => {
    const u = db.findById('users', o.userId);
    const c = db.findById('courses', o.courseId);
    return { ...o, userName: u ? u.name : '-', courseTitle: c ? c.title : '-' };
  });
  res.json({
    stats: {
      students: db.count('users', { role: 'student' }),
      courses: db.count('courses'),
      publishedCourses: db.count('courses', { published: true }),
      enrollments: db.count('enrollments'),
      paidOrders: orders.length,
      revenue,
    },
    recentOrders,
  });
});

// ---- Users ----------------------------------------------------------------
router.get('/users', (req, res) => {
  const users = db.all('users').sort((a, b) => b.id - a.id).map((u) => ({
    ...publicUser(u),
    enrollments: db.count('enrollments', { userId: u.id }),
  }));
  res.json({ users });
});

router.patch('/users/:id', (req, res) => {
  const patch = {};
  if (req.body.role && ['student', 'admin'].includes(req.body.role)) patch.role = req.body.role;
  const u = db.update('users', req.params.id, patch);
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(u) });
});

// ---- Courses --------------------------------------------------------------
router.get('/courses', (req, res) => {
  const courses = db.all('courses').sort((a, b) => b.id - a.id).map((c) => ({
    ...c,
    lessonCount: db.count('lessons', { courseId: c.id }),
    studentCount: db.count('enrollments', { courseId: c.id }),
  }));
  res.json({ courses });
});

router.post('/courses', (req, res) => {
  const b = req.body || {};
  if (!b.title) return res.status(400).json({ error: 'Title required' });
  let slug = b.slug ? slugify(b.slug) : slugify(b.title);
  while (db.findOne('courses', { slug })) slug = slug + '-' + Math.floor(Math.random() * 1000);
  const course = db.insert('courses', {
    title: b.title, titleBn: b.titleBn || b.title, slug,
    summary: b.summary || '', summaryBn: b.summaryBn || '',
    description: b.description || '', descriptionBn: b.descriptionBn || '',
    price: Number(b.price) || 0, discountPrice: Number(b.discountPrice) || 0,
    level: b.level || 'beginner', language: b.language || 'Bangla',
    category: b.category || 'General', categorySlug: slugify(b.category || 'general'),
    instructor: b.instructor || 'AI Pathshala', thumbnail: b.thumbnail || '',
    tags: Array.isArray(b.tags) ? b.tags : String(b.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    featured: !!b.featured, published: !!b.published,
  });
  res.status(201).json({ course });
});

router.patch('/courses/:id', (req, res) => {
  const b = req.body || {};
  const patch = {};
  for (const k of ['title', 'titleBn', 'summary', 'summaryBn', 'description', 'descriptionBn',
    'level', 'language', 'category', 'instructor', 'thumbnail']) {
    if (b[k] !== undefined) patch[k] = b[k];
  }
  for (const k of ['price', 'discountPrice']) if (b[k] !== undefined) patch[k] = Number(b[k]) || 0;
  for (const k of ['featured', 'published']) if (b[k] !== undefined) patch[k] = !!b[k];
  if (b.category !== undefined) patch.categorySlug = slugify(b.category);
  if (b.tags !== undefined) {
    patch.tags = Array.isArray(b.tags) ? b.tags : String(b.tags).split(',').map((t) => t.trim()).filter(Boolean);
  }
  const c = db.update('courses', req.params.id, patch);
  if (!c) return res.status(404).json({ error: 'Course not found' });
  res.json({ course: c });
});

router.delete('/courses/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!db.findById('courses', id)) return res.status(404).json({ error: 'Course not found' });
  db.find('lessons', { courseId: id }).forEach((l) => db.remove('lessons', l.id));
  db.remove('courses', id);
  res.json({ ok: true });
});

// ---- Lessons --------------------------------------------------------------
router.get('/courses/:id/lessons', (req, res) => {
  const lessons = db.find('lessons', { courseId: Number(req.params.id) }).sort((a, b) => a.order - b.order);
  res.json({ lessons });
});

router.post('/courses/:id/lessons', (req, res) => {
  const courseId = Number(req.params.id);
  if (!db.findById('courses', courseId)) return res.status(404).json({ error: 'Course not found' });
  const b = req.body || {};
  const order = b.order !== undefined ? Number(b.order)
    : db.count('lessons', { courseId }) + 1;
  const lesson = db.insert('lessons', {
    courseId, title: b.title || 'Untitled lesson', titleBn: b.titleBn || b.title || '',
    videoUrl: b.videoUrl || '', content: b.content || '', durationMin: Number(b.durationMin) || 0,
    order, preview: !!b.preview,
    section: (b.section || '').trim(), sectionBn: (b.sectionBn || '').trim(),
  });
  res.status(201).json({ lesson });
});

router.patch('/lessons/:id', (req, res) => {
  const b = req.body || {};
  const patch = {};
  for (const k of ['title', 'titleBn', 'videoUrl', 'content', 'section', 'sectionBn']) if (b[k] !== undefined) patch[k] = b[k];
  if (b.durationMin !== undefined) patch.durationMin = Number(b.durationMin) || 0;
  if (b.order !== undefined) patch.order = Number(b.order);
  if (b.preview !== undefined) patch.preview = !!b.preview;
  const l = db.update('lessons', req.params.id, patch);
  if (!l) return res.status(404).json({ error: 'Lesson not found' });
  res.json({ lesson: l });
});

router.delete('/lessons/:id', (req, res) => {
  if (!db.remove('lessons', req.params.id)) return res.status(404).json({ error: 'Lesson not found' });
  res.json({ ok: true });
});

// ---- Orders ---------------------------------------------------------------
router.get('/orders', (req, res) => {
  const orders = db.all('orders').sort((a, b) => b.id - a.id).map((o) => {
    const u = db.findById('users', o.userId);
    const c = db.findById('courses', o.courseId);
    return { ...o, userName: u ? u.name : '-', userEmail: u ? u.email : '-', courseTitle: c ? c.title : '-' };
  });
  res.json({ orders });
});

module.exports = router;
