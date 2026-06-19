const express = require('express');
const db = require('../db');
const config = require('../config');
const gateways = require('../gateways');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function grantEnrollment(userId, courseId) {
  let e = db.findOne('enrollments', { userId, courseId });
  if (!e) e = db.insert('enrollments', { userId, courseId, completedLessons: [] });
  return e;
}

// POST /api/payments/checkout  { courseId, gateway }
// Creates a pending order and returns where to send the buyer next.
router.post('/checkout', requireAuth, async (req, res) => {
  const course = db.findById('courses', req.body.courseId);
  if (!course || !course.published) return res.status(404).json({ error: 'Course not found' });
  const gateway = String(req.body.gateway || 'sslcommerz');
  if (!gateways.GATEWAYS.includes(gateway)) return res.status(400).json({ error: 'Invalid gateway' });

  // Already enrolled?
  if (db.findOne('enrollments', { userId: req.user.id, courseId: course.id })) {
    return res.status(409).json({ error: 'You already own this course' });
  }

  const amount = course.discountPrice && course.discountPrice < course.price
    ? course.discountPrice : course.price;

  // Free course -> enroll immediately.
  if (amount <= 0) {
    grantEnrollment(req.user.id, course.id);
    const order = db.insert('orders', {
      userId: req.user.id, courseId: course.id, amount: 0, currency: config.currency,
      gateway: 'free', status: 'paid', gatewayRef: 'FREE', invoice: 'INV-' + Date.now(),
    });
    return res.json({ free: true, order, redirect: '/learn.html?course=' + course.id });
  }

  const invoice = 'INV-' + Date.now() + '-' + req.user.id;
  const order = db.insert('orders', {
    userId: req.user.id, courseId: course.id, amount, currency: config.currency,
    gateway, status: 'pending', invoice, gatewayRef: null,
  });

  const sandbox = gateways.isSandbox(gateway);
  const sandboxUrl = '/checkout.html?order=' + order.id + '&sim=1';
  const baseUrl = config.appUrl || (req.protocol + '://' + req.get('host'));
  const adapter = gateways.get(gateway);
  try {
    const result = await adapter.createPayment(order, {
      sandboxUrl, req, baseUrl,
      productName: course.title,
      customer: { name: req.user.name, email: req.user.email, phone: req.user.phone },
    });
    db.update('orders', order.id, { gatewayRef: result.gatewayRef });
    res.json({
      orderId: order.id, invoice, amount, currency: config.currency, gateway, sandbox,
      redirectUrl: result.redirectUrl,
    });
  } catch (err) {
    db.update('orders', order.id, { status: 'failed', error: err.message });
    res.status(502).json({ error: err.message });
  }
});

// POST /api/payments/execute  { orderId }
// In sandbox this confirms the simulated payment. In live mode it verifies
// with the gateway, then grants the enrollment.
router.post('/execute', requireAuth, async (req, res) => {
  const order = db.findById('orders', req.body.orderId);
  if (!order || order.userId !== req.user.id) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'paid') {
    return res.json({ status: 'paid', order, redirect: '/learn.html?course=' + order.courseId });
  }
  const adapter = gateways.get(order.gateway);
  try {
    const result = await adapter.verifyPayment(order, { req });
    if (!result.success) {
      db.update('orders', order.id, { status: 'failed' });
      return res.status(402).json({ error: 'Payment was not completed' });
    }
    db.update('orders', order.id, {
      status: 'paid', gatewayRef: result.gatewayRef, paidAt: new Date().toISOString(),
    });
    grantEnrollment(order.userId, order.courseId);
    res.json({ status: 'paid', order: db.findById('orders', order.id),
      redirect: '/learn.html?course=' + order.courseId });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// GET /api/payments/orders  (current user's purchase history)
router.get('/orders', requireAuth, (req, res) => {
  const orders = db.find('orders', { userId: req.user.id })
    .sort((a, b) => b.id - a.id)
    .map((o) => {
      const c = db.findById('courses', o.courseId);
      return { ...o, courseTitle: c ? c.title : '(removed)', courseTitleBn: c ? c.titleBn : '' };
    });
  res.json({ orders });
});

// GET /api/payments/orders/:id
router.get('/orders/:id', requireAuth, (req, res) => {
  const order = db.findById('orders', req.params.id);
  if (!order || (order.userId !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const c = db.findById('courses', order.courseId);
  res.json({ order: { ...order, course: c } });
});

// ---- SSLCommerz redirect/IPN callbacks (LIVE mode) ------------------------
function htmlRedirect(res, to) {
  res.set('Content-Type', 'text/html').send(
    '<!doctype html><meta http-equiv="refresh" content="0;url=' + to + '">' +
    '<p>Redirecting... <a href="' + to + '">continue</a></p>');
}

router.post('/sslcommerz/success', async (req, res) => {
  try {
    const body = req.body || {};
    const order = db.findOne('orders', { invoice: body.tran_id });
    if (!order) return htmlRedirect(res, '/dashboard.html');
    const result = await gateways.get('sslcommerz').verifyPayment(order, { valId: body.val_id, req });
    if (!result.success) {
      db.update('orders', order.id, { status: 'failed' });
      return htmlRedirect(res, '/checkout.html?course=' + order.courseId + '&failed=1');
    }
    db.update('orders', order.id, { status: 'paid', gatewayRef: result.gatewayRef, paidAt: new Date().toISOString() });
    grantEnrollment(order.userId, order.courseId);
    htmlRedirect(res, '/learn.html?course=' + order.courseId);
  } catch (e) { htmlRedirect(res, '/dashboard.html'); }
});

router.post('/sslcommerz/fail', (req, res) => {
  const order = db.findOne('orders', { invoice: (req.body || {}).tran_id });
  if (order) db.update('orders', order.id, { status: 'failed' });
  htmlRedirect(res, order ? '/checkout.html?course=' + order.courseId + '&failed=1' : '/courses.html');
});

router.post('/sslcommerz/cancel', (req, res) => {
  const order = db.findOne('orders', { invoice: (req.body || {}).tran_id });
  if (order) db.update('orders', order.id, { status: 'cancelled' });
  htmlRedirect(res, order ? '/checkout.html?course=' + order.courseId : '/courses.html');
});

router.post('/sslcommerz/ipn', async (req, res) => {
  try {
    const body = req.body || {};
    const order = db.findOne('orders', { invoice: body.tran_id });
    if (!order) return res.json({ ok: false });
    if (order.status !== 'paid') {
      const result = await gateways.get('sslcommerz').verifyPayment(order, { valId: body.val_id, req });
      if (result.success) {
        db.update('orders', order.id, { status: 'paid', gatewayRef: result.gatewayRef, paidAt: new Date().toISOString() });
        grantEnrollment(order.userId, order.courseId);
      }
    }
    res.json({ ok: true });
  } catch (e) { res.json({ ok: false }); }
});

module.exports = router;
