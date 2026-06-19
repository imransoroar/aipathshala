const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function withStats(course) {
  const reviews = db.find('reviews', { courseId: course.id });
  const lessons = db.find('lessons', { courseId: course.id });
  const rating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;
  return {
    ...course,
    lessonCount: lessons.length,
    studentCount: db.count('enrollments', { courseId: course.id }),
    reviewCount: reviews.length,
    rating: Math.round(rating * 10) / 10,
  };
}

// GET /api/courses  (public catalogue, only published)
router.get('/', (req, res) => {
  const { category, q, level, sort } = req.query;
  let list = db.find('courses', { published: true });
  if (category) list = list.filter((c) => c.categorySlug === category);
  if (level) list = list.filter((c) => c.level === level);
  if (q) {
    const term = String(q).toLowerCase();
    list = list.filter((c) =>
      (c.title + ' ' + c.titleBn + ' ' + c.summary + ' ' + (c.tags || []).join(' '))
        .toLowerCase()
        .includes(term)
    );
  }
  list = list.map(withStats);
  if (sort === 'popular') list.sort((a, b) => b.studentCount - a.studentCount);
  else if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
  else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.id - a.id);
  res.json({ courses: list });
});

// GET /api/courses/categories
router.get('/categories', (req, res) => {
  const cats = db.all('categories').map((c) => ({
    ...c,
    courseCount: db.count('courses', { categorySlug: c.slug, published: true }),
  }));
  res.json({ categories: cats });
});

// GET /api/courses/:slug  (detail + curriculum; locks video URLs unless enrolled)
router.get('/:slug', (req, res) => {
  const course = db.findOne('courses', { slug: req.params.slug });
  if (!course || (!course.published && (!req.user || req.user.role !== 'admin'))) {
    return res.status(404).json({ error: 'Course not found' });
  }
  const enrolled = req.user
    ? !!db.findOne('enrollments', { userId: req.user.id, courseId: course.id })
    : false;
  const isAdmin = req.user && req.user.role === 'admin';

  const lessons = db
    .find('lessons', { courseId: course.id })
    .sort((a, b) => a.order - b.order)
    .map((l) => {
      const open = enrolled || isAdmin || l.preview;
      return {
        id: l.id,
        title: l.title,
        titleBn: l.titleBn,
        order: l.order,
        durationMin: l.durationMin,
        preview: l.preview,
        locked: !open,
        videoUrl: open ? l.videoUrl : null,
        content: open ? l.content : null,
      };
    });

  const reviews = db.find('reviews', { courseId: course.id }).map((r) => {
    const u = db.findById('users', r.userId);
    return { ...r, userName: u ? u.name : 'Student' };
  });

  res.json({ course: withStats(course), lessons, reviews, enrolled });
});

// POST /api/courses/:id/reviews  (enrolled students only)
router.post('/:id/reviews', requireAuth, (req, res) => {
  const course = db.findById('courses', req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const enrolled = db.findOne('enrollments', { userId: req.user.id, courseId: course.id });
  if (!enrolled) return res.status(403).json({ error: 'Only enrolled students can review' });
  const rating = Math.min(5, Math.max(1, parseInt(req.body.rating, 10) || 0));
  if (!rating) return res.status(400).json({ error: 'Rating 1-5 required' });
  const existing = db.findOne('reviews', { userId: req.user.id, courseId: course.id });
  if (existing) {
    db.update('reviews', existing.id, { rating, comment: req.body.comment || '' });
    return res.json({ review: db.findById('reviews', existing.id) });
  }
  const review = db.insert('reviews', {
    userId: req.user.id, courseId: course.id, rating, comment: req.body.comment || '',
  });
  res.status(201).json({ review });
});

// GET /api/courses/by-id/:id  (lightweight, for checkout summary)
router.get('/by-id/:id', (req, res) => {
  const c = db.findById('courses', req.params.id);
  if (!c || !c.published) return res.status(404).json({ error: 'Course not found' });
  res.json({ course: withStats(c) });
});

module.exports = router;
module.exports.withStats = withStats;
