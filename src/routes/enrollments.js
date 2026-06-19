const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function courseProgress(enrollment) {
  const lessons = db.find('lessons', { courseId: enrollment.courseId });
  const done = (enrollment.completedLessons || []).length;
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
  return { total: lessons.length, completed: done, percent: pct };
}

// GET /api/enrollments  (current user's courses, "My Learning")
router.get('/', requireAuth, (req, res) => {
  const list = db.find('enrollments', { userId: req.user.id }).map((e) => {
    const course = db.findById('courses', e.courseId);
    return {
      enrollmentId: e.id,
      enrolledAt: e.createdAt,
      progress: courseProgress(e),
      course: course
        ? { id: course.id, slug: course.slug, title: course.title, titleBn: course.titleBn,
            thumbnail: course.thumbnail, level: course.level, instructor: course.instructor }
        : null,
    };
  });
  res.json({ enrollments: list.filter((e) => e.course) });
});

// GET /api/enrollments/:courseId/player  (full curriculum with video URLs)
router.get('/:courseId/player', requireAuth, (req, res) => {
  const course = db.findById('courses', req.params.courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const enrollment = db.findOne('enrollments', { userId: req.user.id, courseId: course.id });
  if (!enrollment && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You are not enrolled in this course' });
  }
  const lessons = db
    .find('lessons', { courseId: course.id })
    .sort((a, b) => a.order - b.order)
    .map((l) => ({
      id: l.id, title: l.title, titleBn: l.titleBn, order: l.order,
      durationMin: l.durationMin, videoUrl: l.videoUrl, content: l.content,
      completed: enrollment ? (enrollment.completedLessons || []).includes(l.id) : false,
    }));
  res.json({
    course: { id: course.id, slug: course.slug, title: course.title, titleBn: course.titleBn },
    lessons,
    progress: enrollment ? courseProgress(enrollment) : { total: lessons.length, completed: 0, percent: 0 },
  });
});

// POST /api/enrollments/:courseId/complete  { lessonId, done }
router.post('/:courseId/complete', requireAuth, (req, res) => {
  const enrollment = db.findOne('enrollments', {
    userId: req.user.id, courseId: Number(req.params.courseId),
  });
  if (!enrollment) return res.status(403).json({ error: 'Not enrolled' });
  const lessonId = Number(req.body.lessonId);
  const done = req.body.done !== false;
  const set = new Set(enrollment.completedLessons || []);
  if (done) set.add(lessonId); else set.delete(lessonId);
  const updated = db.update('enrollments', enrollment.id, { completedLessons: [...set] });
  res.json({ progress: courseProgress(updated) });
});

module.exports = router;
module.exports.courseProgress = courseProgress;
