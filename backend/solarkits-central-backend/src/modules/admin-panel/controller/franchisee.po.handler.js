/**
 * franchisee.po.handler.js
 *
 * HTTP controller for the Franchisee PO lifecycle.
 * Wraps franchisee.po.service.js with request parsing and error handling.
 *
 * Permission code: FPO_ORDER
 * Prefix: /admin-api/franchisee/po
 */

const mongoose = require('mongoose');
const { FpoOrder } = require('../models/india_solarshop_db');
const {
  createPoDraft,
  submitPo,
  approvePo,
  rejectPo,
  confirmPayment,
  dispatchPo,
  deliverPo,
  cancelPo,
  returnItems,
} = require('../services/franchisee.po.service');

// ── LIST ──────────────────────────────────────────────────────────────────────
const list_po_orders = async (req, res) => {
  try {
    const { franchisee_id, status, plan_id, state_id, district_id, from_date, to_date, page = 1, limit = 20 } = req.query;
    const query = { deleted_at: null };

    if (franchisee_id) query.franchisee_id = franchisee_id;
    if (status) query.status = { $in: status.split(',') };
    if (plan_id) query.plan_id = plan_id;
    if (state_id) query.state_id = state_id;
    if (district_id) query.district_id = district_id;
    if (from_date || to_date) {
      query.created_at = {};
      if (from_date) query.created_at.$gte = new Date(from_date);
      if (to_date)   query.created_at.$lte = new Date(to_date);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      FpoOrder.find(query)
        .populate('franchisee_id', 'business_name mobile email')
        .populate('plan_id', 'name territory_level')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      FpoOrder.countDocuments(query),
    ]);

    return res.json({
      status: 'success',
      data:   orders,
      meta:   { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('[po.handler] list error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── GET SINGLE ────────────────────────────────────────────────────────────────
const get_po_order = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ status: 'error', message: 'Invalid PO id' });

    const order = await FpoOrder.findOne({ _id: id, deleted_at: null })
      .populate('franchisee_id', 'business_name mobile email address')
      .populate('plan_id', 'name territory_level')
      .lean();

    if (!order) return res.status(404).json({ status: 'error', message: 'PO not found' });

    return res.json({ status: 'success', data: order });
  } catch (error) {
    console.error('[po.handler] get error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── CREATE DRAFT ──────────────────────────────────────────────────────────────
const create_draft = async (req, res) => {
  try {
    const { franchisee_id, items, idempotency_key, payment_terms } = req.body;
    if (!franchisee_id) return res.status(400).json({ status: 'error', message: 'franchisee_id is required' });

    const result = await createPoDraft({
      franchisee_id,
      items,
      idempotency_key,
      payment_terms,
      actor_id: req.user?.id,
      req,
    });

    if (result.already_exists) {
      return res.status(200).json({ status: 'success', message: 'PO draft already exists (idempotent)', data: result.order });
    }
    return res.status(201).json({ status: 'success', message: `Draft PO ${result.order.po_number} created`, data: result.order });
  } catch (error) {
    console.error('[po.handler] create_draft error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ── SUBMIT ────────────────────────────────────────────────────────────────────
const submit_po = async (req, res) => {
  try {
    const { po_id, franchisee_id } = req.body;
    if (!po_id) return res.status(400).json({ status: 'error', message: 'po_id is required' });

    const order = await submitPo({ po_id, franchisee_id, actor_id: req.user?.id, req });
    return res.json({ status: 'success', message: `PO ${order.po_number} submitted`, data: { id: order._id, status: order.status } });
  } catch (error) {
    console.error('[po.handler] submit error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ── APPROVE ───────────────────────────────────────────────────────────────────
const approve_po = async (req, res) => {
  try {
    const { po_id, notes } = req.body;
    if (!po_id) return res.status(400).json({ status: 'error', message: 'po_id is required' });

    const order = await approvePo({ po_id, admin_id: req.user?.id, notes, req });
    return res.json({ status: 'success', message: `PO approved`, data: { id: order._id, status: order.status } });
  } catch (error) {
    console.error('[po.handler] approve error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ── REJECT ────────────────────────────────────────────────────────────────────
const reject_po = async (req, res) => {
  try {
    const { po_id, reason } = req.body;
    if (!po_id || !reason) return res.status(400).json({ status: 'error', message: 'po_id and reason are required' });

    const order = await rejectPo({ po_id, admin_id: req.user?.id, reason, req });
    return res.json({ status: 'success', message: `PO rejected`, data: { id: order._id, status: order.status } });
  } catch (error) {
    console.error('[po.handler] reject error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ── CONFIRM PAYMENT ───────────────────────────────────────────────────────────
const confirm_payment = async (req, res) => {
  try {
    const po_id = req.body.po_id || req.body.order_id;
    const { payment_reference, razorpay_payment_id } = req.body;
    if (!po_id) return res.status(400).json({ status: 'error', message: 'po_id or order_id is required' });

    const order = await confirmPayment({ po_id, payment_reference, razorpay_payment_id, admin_id: req.user?.id, req });
    return res.json({ status: 'success', message: 'Payment confirmed', data: { id: order._id, status: order.status } });
  } catch (error) {
    console.error('[po.handler] confirm_payment error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ── DISPATCH ──────────────────────────────────────────────────────────────────
const dispatch_po = async (req, res) => {
  try {
    const { po_id } = req.body;
    if (!po_id) return res.status(400).json({ status: 'error', message: 'po_id is required' });

    const order = await dispatchPo({ po_id, admin_id: req.user?.id, req });
    return res.json({ status: 'success', message: 'PO dispatched', data: { id: order._id, status: order.status } });
  } catch (error) {
    console.error('[po.handler] dispatch error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ── DELIVER ───────────────────────────────────────────────────────────────────
const deliver_po = async (req, res) => {
  try {
    const { po_id, delivered_items } = req.body;
    if (!po_id) return res.status(400).json({ status: 'error', message: 'po_id is required' });

    const order = await deliverPo({ po_id, delivered_items, admin_id: req.user?.id, req });
    return res.json({ status: 'success', message: 'PO delivered. Goal and commission updated.', data: { id: order._id, status: order.status } });
  } catch (error) {
    console.error('[po.handler] deliver error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ── CANCEL ────────────────────────────────────────────────────────────────────
const cancel_po = async (req, res) => {
  try {
    const { po_id, reason } = req.body;
    if (!po_id || !reason) return res.status(400).json({ status: 'error', message: 'po_id and reason are required' });

    const order = await cancelPo({ po_id, reason, cancelled_by: req.user?.id, req });
    return res.json({ status: 'success', message: 'PO cancelled', data: { id: order._id, status: order.status } });
  } catch (error) {
    console.error('[po.handler] cancel error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ── RETURN ITEMS ──────────────────────────────────────────────────────────────
const process_returns = async (req, res) => {
  try {
    const { po_id, return_items, reason } = req.body;
    if (!po_id || !return_items || !reason) {
      return res.status(400).json({ status: 'error', message: 'po_id, return_items, and reason are required' });
    }

    const order = await returnItems({ po_id, return_items, reason, actor_id: req.user?.id, req });
    return res.json({ status: 'success', message: 'Returns processed. Goal and commission adjusted.', data: { id: order._id } });
  } catch (error) {
    console.error('[po.handler] returns error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ── LIST PENDING EPC RECEIPTS ──────────────────────────────────────────────────
/**
 * GET /admin-api/franchisee/po/pending-receipts
 * Returns all FPO orders that have at least one EPC allocation with payment_status = 'RECEIPT_SUBMITTED'
 */
const list_pending_epc_receipts = async (req, res) => {
  try {
    const { franchisee_id, page = 1, limit = 20 } = req.query;
    const query = {
      'items.epc_allocations.payment_status': 'RECEIPT_SUBMITTED',
      deleted_at: null,
    };
    if (franchisee_id) query.franchisee_id = franchisee_id;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      FpoOrder.find(query)
        .populate('franchisee_id', 'business_name mobile email')
        .populate('plan_id', 'name territory_level')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      FpoOrder.countDocuments(query),
    ]);

    return res.json({
      status: 'success',
      data: orders,
      meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('[po.handler] list_pending_epc_receipts error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── ADMIN: VERIFY EPC PAYMENT RECEIPT ─────────────────────────────────────────
/**
 * POST /admin-api/franchisee/po/verify-epc-receipt
 * Body: { po_id, epc_buyer_id, action: 'verify'|'reject', rejection_note? }
 * - Verifies or rejects an EPC buyer's payment receipt
 * - If all allocations become VERIFIED → auto-transitions PO to PAID
 */
const verify_epc_receipt = async (req, res) => {
  try {
    const po_id = req.body.po_id || req.body.order_id;
    const { epc_buyer_id, action = 'verify', rejection_note } = req.body;
    if (!po_id || !epc_buyer_id) {
      return res.status(400).json({ status: 'error', message: 'po_id (or order_id) and epc_buyer_id are required' });
    }

    const order = await FpoOrder.findOne({ _id: po_id, deleted_at: null });
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'PO not found' });
    }

    let updated = false;
    order.items.forEach(item => {
      (item.epc_allocations || []).forEach(alloc => {
        if (alloc.epc_buyer_id && alloc.epc_buyer_id.toString() === epc_buyer_id.toString()) {
          if (action === 'reject') {
            alloc.payment_status = 'PENDING';
            alloc.payment_notes = rejection_note || 'Receipt rejected by admin. Please re-upload.';
            alloc.payment_receipt_url = null;
          } else {
            alloc.payment_status = 'VERIFIED';
            alloc.paid_at = new Date();
            alloc.payment_notes = null;
          }
          updated = true;
        }
      });
    });

    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'EPC allocation not found in this PO' });
    }

    // Auto-transition to PAID if all allocations are now VERIFIED
    if (action !== 'reject') {
      const allAllocations = order.items.flatMap(item => item.epc_allocations || []);
      const allVerified = allAllocations.length > 0 &&
        allAllocations.every(a => a.payment_status === 'VERIFIED');

      if (allVerified) {
        if (['SUBMITTED', 'PENDING_APPROVAL', 'APPROVED'].includes(order.status)) {
          order.status = 'AWAITING_PAYMENT';
          await order.save();
        }

        if (['AWAITING_PAYMENT', 'PARTIALLY_PAID'].includes(order.status)) {
          await order.save();
          const updated_order = await confirmPayment({
            po_id: order._id,
            payment_reference: 'ADMIN_EPC_RECEIPTS_VERIFIED',
            admin_id: req.user?.id,
            req,
          });
          return res.json({
            status: 'success',
            message: 'All EPC receipts verified. PO status updated to PAID.',
            data: { id: updated_order._id, status: updated_order.status },
            all_verified: true,
          });
        }
      }
    }

    await order.save();
    return res.json({
      status: 'success',
      message: action === 'reject'
        ? 'Receipt rejected. EPC buyer will be notified to re-upload.'
        : 'EPC payment receipt verified.',
      all_verified: false,
    });
  } catch (error) {
    console.error('[po.handler] verify_epc_receipt error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  list_po_orders,
  get_po_order,
  create_draft,
  submit_po,
  approve_po,
  reject_po,
  confirm_payment,
  dispatch_po,
  deliver_po,
  cancel_po,
  process_returns,
  list_pending_epc_receipts,
  verify_epc_receipt,
};
