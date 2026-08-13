/**
 * razorpay.service.js
 *
 * Central production-grade Razorpay Service wrapper.
 * Provides helper functions for:
 *   - Server-side Razorpay Order creation (amounts in Paise)
 *   - Payment HMAC-SHA256 signature verification
 *   - Webhook HMAC-SHA256 signature verification
 *   - Payment details retrieval
 *   - Refund creation
 *   - Config/Health status check
 */

const crypto = require('crypto');
const Razorpay = require('razorpay');

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_ID;
  const key_secret = process.env.RAZORPAY_KEY;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials (RAZORPAY_ID / RAZORPAY_KEY) are not configured in environment variables');
  }

  return new Razorpay({ key_id, key_secret });
}

/**
 * Check gateway configuration status without exposing secret key.
 */
function getGatewayStatus() {
  const keyId = process.env.RAZORPAY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY || '';

  const isConfigured = Boolean(keyId && keySecret);
  const isTestMode = keyId.startsWith('rzp_test_');

  return {
    is_configured: isConfigured,
    mode: isTestMode ? 'test' : 'production',
    key_id_masked: keyId ? `${keyId.substring(0, 8)}...` : 'NOT_SET',
    has_webhook_secret: Boolean(webhookSecret),
  };
}

/**
 * Create a server-calculated Razorpay order.
 * @param {Object} params
 * @param {number} params.amountPaise - Amount in integer Paise (1 INR = 100 Paise)
 * @param {string} [params.currency='INR']
 * @param {string} [params.receipt]
 * @param {Object} [params.notes]
 */
async function createRazorpayOrder({ amountPaise, currency = 'INR', receipt, notes = {} }) {
  if (!amountPaise || amountPaise <= 0 || !Number.isInteger(amountPaise)) {
    throw new Error('Valid integer amount in Paise is required for Razorpay order creation');
  }

  const razorpay = getRazorpayInstance();
  const options = {
    amount: amountPaise,
    currency,
    receipt: receipt || `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    notes,
  };

  const order = await razorpay.orders.create(options);
  return {
    order_id: order.id,
    amount_paise: order.amount,
    amount_inr: (order.amount / 100).toFixed(2),
    currency: order.currency,
    key_id: process.env.RAZORPAY_ID,
    receipt: order.receipt,
    status: order.status,
  };
}

/**
 * Verify Razorpay payment signature from frontend callback.
 * Formula: HMAC-SHA256(order_id + "|" + payment_id, key_secret) === signature
 */
function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  const keySecret = process.env.RAZORPAY_KEY;
  if (!keySecret) return false;

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  return generatedSignature === razorpay_signature;
}

/**
 * Verify Razorpay webhook signature.
 * Formula: HMAC-SHA256(rawBody, webhookSecret) === x-razorpay-signature
 */
function verifyWebhookSignature(rawBody, signature) {
  if (!rawBody || !signature) return false;

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY;
  if (!secret) return false;

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
    .digest('hex');

  return generatedSignature === signature;
}

/**
 * Fetch payment details from Razorpay API.
 */
async function fetchPaymentDetails(paymentId) {
  if (!paymentId) throw new Error('Payment ID is required');
  const razorpay = getRazorpayInstance();
  return await razorpay.payments.fetch(paymentId);
}

/**
 * Create a full or partial refund for a captured payment.
 */
async function createRazorpayRefund({ paymentId, amountPaise, notes = {} }) {
  if (!paymentId) throw new Error('Payment ID is required for refund');
  const razorpay = getRazorpayInstance();

  const options = { notes };
  if (amountPaise && amountPaise > 0) {
    options.amount = amountPaise;
  }

  const refund = await razorpay.payments.refund(paymentId, options);
  return {
    refund_id: refund.id,
    payment_id: refund.payment_id,
    amount_paise: refund.amount,
    amount_inr: (refund.amount / 100).toFixed(2),
    status: refund.status,
    created_at: refund.created_at,
  };
}

module.exports = {
  getGatewayStatus,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPaymentDetails,
  createRazorpayRefund,
};
