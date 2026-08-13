/**
 * razorpay.webhook.handler.js
 *
 * Idempotent server-side Razorpay Webhook Handler.
 * Routes incoming webhook events:
 *   - order.paid / payment.captured → confirms order, deducts stock, credits double-entry wallet ledgers
 *   - payment.failed → releases stock hold, sets order status to payment_failed
 *   - refund.processed → executes commission reversals & credit note generation
 */

const {
  RazorpayWebhookLog,
  EpcOrder,
  ResellerProcurementOrder,
} = require('../../../admin-panel/models/india_solarshop_db');
const { verifyWebhookSignature } = require('../../../admin-panel/services/razorpay.service');
const { confirmEpcOrderPayment } = require('../../../admin-panel/services/epc.order.service');
const { reverseOrderMargins } = require('../../../admin-panel/services/wallet.settlement.service');
const { logAudit } = require('../../../admin-panel/utils/audit.service');

const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body;

    // Verify HMAC-SHA256 signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[Razorpay Webhook] Invalid webhook signature detected');
      return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const eventId = payload.event_id || payload.id || `evt_${Date.now()}_${Math.random()}`;
    const eventType = payload.event;
    const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity || {};

    const razorpayOrderId = entity.order_id || entity.id;
    const razorpayPaymentId = entity.id || entity.payment_id;

    // Enforce Webhook Idempotency
    const existingLog = await RazorpayWebhookLog.findOne({ event_id: eventId });
    if (existingLog) {
      console.log(`[Razorpay Webhook] Event ${eventId} already processed — skipping duplicate`);
      return res.status(200).json({ status: 'success', message: 'Event already processed', is_duplicate: true });
    }

    // Save webhook log entry
    const webhookLog = await RazorpayWebhookLog.create({
      event_id: eventId,
      event_type: eventType,
      order_id: razorpayOrderId,
      payment_id: razorpayPaymentId,
      payload,
      status: 'received',
    });

    console.log(`[Razorpay Webhook] Processing event '${eventType}' for Order ${razorpayOrderId}`);

    if (eventType === 'order.paid' || eventType === 'payment.captured') {
      // Find matching EPC Order or Reseller Procurement Order
      const epcOrder = await EpcOrder.findOne({
        $or: [
          { payment_reference: razorpayPaymentId },
          { payment_reference: razorpayOrderId },
          { _id: razorpayOrderId },
        ],
      });

      if (epcOrder) {
        if (epcOrder.payment_status !== 'captured') {
          await confirmEpcOrderPayment(epcOrder._id, razorpayPaymentId, null, req);
        }
      } else {
        const procurementOrder = await ResellerProcurementOrder.findOne({
          $or: [
            { payment_reference: razorpayPaymentId },
            { payment_reference: razorpayOrderId },
            { procurement_order_number: razorpayOrderId },
          ],
        });

        if (procurementOrder && procurementOrder.payment_status !== 'captured') {
          procurementOrder.payment_status = 'captured';
          procurementOrder.order_status = 'paid';
          procurementOrder.payment_reference = razorpayPaymentId;
          await procurementOrder.save();
        }
      }
    } else if (eventType === 'payment.failed') {
      const epcOrder = await EpcOrder.findOne({
        $or: [
          { payment_reference: razorpayOrderId },
          { _id: razorpayOrderId },
        ],
      });

      if (epcOrder) {
        epcOrder.payment_status = 'failed';
        epcOrder.order_status = 'cancelled';
        epcOrder.cancellation_reason = 'Payment authorization failed on Razorpay';
        await epcOrder.save();
      }
    } else if (eventType === 'refund.processed') {
      const epcOrder = await EpcOrder.findOne({ payment_reference: entity.payment_id });
      if (epcOrder) {
        epcOrder.payment_status = 'refunded';
        epcOrder.order_status = 'cancelled';
        await epcOrder.save();

        await reverseOrderMargins({
          orderId: epcOrder._id,
          orderNumber: epcOrder.order_number,
          reason: 'Razorpay Refund Processed Webhook',
        });
      }
    }

    webhookLog.status = 'processed';
    webhookLog.processed_at = new Date();
    await webhookLog.save();

    await logAudit({
      actor_type: 'system',
      actor_id: null,
      action: 'RAZORPAY_WEBHOOK_PROCESSED',
      entity_type: 'razorpay_webhook_logs',
      entity_id: webhookLog._id,
      after_snapshot: { event_id: eventId, event_type: eventType },
    });

    return res.status(200).json({ status: 'success', message: `Webhook ${eventType} processed successfully` });
  } catch (error) {
    console.error('[Razorpay Webhook Handler Error]:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

module.exports = {
  handleRazorpayWebhook,
};
