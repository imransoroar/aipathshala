/* Central config, sourced from environment variables with safe defaults. */
const path = require('path');

// Minimal .env loader (avoids an extra dependency).
(function loadDotEnv() {
  const fs = require('fs');
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].replace(/^["']|["']$/g, '');
    if (process.env[key] === undefined) process.env[key] = val;
  }
})();

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  currency: process.env.CURRENCY || 'BDT',
  appUrl: process.env.APP_URL || '',  // public base URL, e.g. https://aipathshala.onrender.com

  // Payment gateway placeholders. Fill these in with real credentials to
  // go live. While they are empty the app runs in "sandbox" mode and
  // simulates a successful payment so the full flow can be demoed.
  payment: {
    sandbox: process.env.PAYMENT_SANDBOX !== 'false',
    bkash: {
      enabled: process.env.BKASH_ENABLED === 'true',
      appKey: process.env.BKASH_APP_KEY || '',
      appSecret: process.env.BKASH_APP_SECRET || '',
      username: process.env.BKASH_USERNAME || '',
      password: process.env.BKASH_PASSWORD || '',
      baseUrl: process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
    },
    nagad: {
      enabled: process.env.NAGAD_ENABLED === 'true',
      merchantId: process.env.NAGAD_MERCHANT_ID || '',
      merchantNumber: process.env.NAGAD_MERCHANT_NUMBER || '',
      publicKey: process.env.NAGAD_PUBLIC_KEY || '',
      privateKey: process.env.NAGAD_PRIVATE_KEY || '',
      baseUrl: process.env.NAGAD_BASE_URL || 'https://sandbox.mynagad.com',
    },
    sslcommerz: {
      enabled: process.env.SSLCZ_ENABLED === 'true',
      storeId: process.env.SSLCZ_STORE_ID || '',
      storePassword: process.env.SSLCZ_STORE_PASSWORD || '',
      sandbox: process.env.SSLCZ_SANDBOX !== 'false',
    },
  },
};
