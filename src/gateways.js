/*
 * Payment gateway adapters for Bangladesh: SSLCommerz (live-ready), bKash, Nagad.
 * -------------------------------------------------------------------
 * Each adapter exposes:
 *   createPayment(order, ctx)  -> { redirectUrl, gatewayRef }
 *   verifyPayment(order, ctx)  -> { success, gatewayRef, raw }
 *
 * SANDBOX mode (default) never calls an external API: it returns a local
 * simulated-checkout URL so the whole journey works for demos/tests.
 *
 * SSLCommerz is fully implemented for LIVE mode below. To switch it on:
 *   PAYMENT_SANDBOX=false  SSLCZ_ENABLED=true  SSLCZ_SANDBOX=false
 *   SSLCZ_STORE_ID=...     SSLCZ_STORE_PASSWORD=...   APP_URL=https://yourdomain
 * No code changes needed — just credentials. (bKash/Nagad still need their
 * official calls filled into the marked TODO blocks, or use SSLCommerz which
 * already routes bKash + Nagad + cards through one integration.)
 */
const config = require('./config');

const GATEWAYS = ['bkash', 'nagad', 'sslcommerz'];

function isSandbox(gateway) {
  if (config.payment.sandbox) return true;
  const g = config.payment[gateway];
  return !g || !g.enabled;
}

function form(obj) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => p.append(k, v == null ? '' : String(v)));
  return p;
}

// ---- SSLCommerz (cards + bKash + Nagad + all MFS) — LIVE READY ------------
const sslcommerz = {
  hosts() {
    const sb = config.payment.sslcommerz.sandbox;
    return {
      session: sb ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
                  : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php',
      validate: sb ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
                  : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php',
    };
  },
  async createPayment(order, ctx) {
    if (isSandbox('sslcommerz')) {
      return { redirectUrl: ctx.sandboxUrl, gatewayRef: 'SSLCZ-SBX-' + order.id };
    }
    const cfg = config.payment.sslcommerz;
    const base = ctx.baseUrl; // public app URL, e.g. https://aipathshala.onrender.com
    const body = form({
      store_id: cfg.storeId,
      store_passwd: cfg.storePassword,
      total_amount: order.amount,
      currency: order.currency || 'BDT',
      tran_id: order.invoice,
      success_url: base + '/api/payments/sslcommerz/success',
      fail_url: base + '/api/payments/sslcommerz/fail',
      cancel_url: base + '/api/payments/sslcommerz/cancel',
      ipn_url: base + '/api/payments/sslcommerz/ipn',
      product_name: ctx.productName || 'Course',
      product_category: 'Education',
      product_profile: 'general',
      cus_name: ctx.customer?.name || 'Student',
      cus_email: ctx.customer?.email || 'student@example.com',
      cus_phone: ctx.customer?.phone || '01700000000',
      cus_add1: 'Dhaka', cus_city: 'Dhaka', cus_country: 'Bangladesh',
      shipping_method: 'NO',
    });
    const res = await fetch(this.hosts().session, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    });
    const data = await res.json();
    if (data.status !== 'SUCCESS' || !data.GatewayPageURL) {
      throw new Error('SSLCommerz session failed: ' + (data.failedreason || data.status || 'unknown'));
    }
    return { redirectUrl: data.GatewayPageURL, gatewayRef: data.sessionkey };
  },
  async verifyPayment(order, ctx) {
    if (isSandbox('sslcommerz')) {
      return { success: true, gatewayRef: 'SSLCZ-SBX-' + order.id, raw: { sandbox: true } };
    }
    const cfg = config.payment.sslcommerz;
    const valId = ctx.valId;
    if (!valId) return { success: false, raw: { error: 'missing val_id' } };
    const url = this.hosts().validate + '?' + form({
      val_id: valId, store_id: cfg.storeId, store_passwd: cfg.storePassword, format: 'json', v: 1,
    }).toString();
    const res = await fetch(url);
    const data = await res.json();
    const ok = (data.status === 'VALID' || data.status === 'VALIDATED')
      && Number(data.amount) >= Number(order.amount) - 1; // amount sanity check
    return { success: ok, gatewayRef: data.bank_tran_id || valId, raw: data };
  },
};

// ---- bKash (Tokenized Checkout) -------------------------------------------
const bkash = {
  async createPayment(order, ctx) {
    if (isSandbox('bkash')) return { redirectUrl: ctx.sandboxUrl, gatewayRef: 'BKASH-SBX-' + order.id };
    // TODO (LIVE): grant token -> POST {baseUrl}/tokenized/checkout/token/grant
    // then create  -> POST {baseUrl}/tokenized/checkout/create ; return bkashURL.
    throw new Error('bKash live mode not implemented. Use SSLCommerz, or fill src/gateways.js');
  },
  async verifyPayment(order) {
    if (isSandbox('bkash')) return { success: true, gatewayRef: 'BKASH-SBX-' + order.id, raw: { sandbox: true } };
    // TODO (LIVE): POST {baseUrl}/tokenized/checkout/execute ; transactionStatus === 'Completed'.
    throw new Error('bKash live verify not implemented.');
  },
};

// ---- Nagad ----------------------------------------------------------------
const nagad = {
  async createPayment(order, ctx) {
    if (isSandbox('nagad')) return { redirectUrl: ctx.sandboxUrl, gatewayRef: 'NAGAD-SBX-' + order.id };
    // TODO (LIVE): initialize -> complete (RSA-signed). Use SSLCommerz for an easier path.
    throw new Error('Nagad live mode not implemented. Use SSLCommerz, or fill src/gateways.js');
  },
  async verifyPayment(order) {
    if (isSandbox('nagad')) return { success: true, gatewayRef: 'NAGAD-SBX-' + order.id, raw: { sandbox: true } };
    throw new Error('Nagad live verify not implemented.');
  },
};

const adapters = { bkash, nagad, sslcommerz };

module.exports = {
  GATEWAYS, isSandbox,
  get(g) { if (!adapters[g]) throw new Error('Unsupported gateway: ' + g); return adapters[g]; },
};
