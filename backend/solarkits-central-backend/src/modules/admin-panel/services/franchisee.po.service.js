/**
 * franchisee.po.service.js
 *
 * Complete lifecycle management for Franchisee Purchase Orders (fpo_orders collection).
 *
 * Valid status transitions:
 *   DRAFT → SUBMITTED
 *   SUBMITTED → PENDING_APPROVAL | APPROVED | REJECTED
 *   PENDING_APPROVAL → CHANGES_REQUESTED | APPROVED | REJECTED
 *   CHANGES_REQUESTED → SUBMITTED
 *   APPROVED → AWAITING_PAYMENT
 *   AWAITING_PAYMENT → PARTIALLY_PAID | PAID
 *   PARTIALLY_PAID → PAID
 *   PAID → STOCK_ALLOCATED
 *   STOCK_ALLOCATED → PROCESSING
 *   PROCESSING → PARTIALLY_DISPATCHED | DISPATCHED
 *   PARTIALLY_DISPATCHED → DISPATCHED
 *   DISPATCHED → PARTIALLY_DELIVERED | DELIVERED
 *   PARTIALLY_DELIVERED → DELIVERED
 *   DELIVERED → COMPLETED
 *   any (except COMPLETED/EXPIRED) → CANCELLED
 */

const mongoose = require('mongoose');
const {
  FpoOrder,
  Reseller,
  ResellerPlanSubscription,
  FranchiseePlanPoSetting,
} = require('../models/india_solarshop_db');
const { resolveEffectivePoSettings, validatePoItems, resolveEffectiveMoqRule } = require('./franchisee.moq.service');
const { resolveCommissionRule } = require('./franchisee.commission.service');
const { recalculateProgress } = require('./franchisee.goal.service');
const { postCommission, reverseCommission } = require('./franchisee.commission.service');
const { logAudit } = require('../utils/audit.service');

// ── Allowed status transitions ────────────────────────────────────────────────
const ALLOWED_TRANSITIONS = {
  DRAFT:               ['SUBMITTED', 'CANCELLED', 'EXPIRED'],
  SUBMITTED:           ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'CANCELLED'],
  PENDING_APPROVAL:    ['CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED'],
  CHANGES_REQUESTED:   ['SUBMITTED', 'CANCELLED'],
  APPROVED:            ['AWAITING_PAYMENT', 'CANCELLED'],
  REJECTED:            [],
  AWAITING_PAYMENT:    ['PARTIALLY_PAID', 'PAID', 'CANCELLED'],
  PARTIALLY_PAID:      ['PAID', 'CANCELLED'],
  PAID:                ['STOCK_ALLOCATED', 'CANCELLED'],
  STOCK_ALLOCATED:     ['PROCESSING', 'CANCELLED'],
  PROCESSING:          ['PARTIALLY_DISPATCHED', 'DISPATCHED', 'CANCELLED'],
  PARTIALLY_DISPATCHED:['DISPATCHED', 'CANCELLED'],
  DISPATCHED:          ['PARTIALLY_DELIVERED', 'DELIVERED'],
  PARTIALLY_DELIVERED: ['DELIVERED'],
  DELIVERED:           ['COMPLETED'],
  COMPLETED:           [],
  CANCELLED:           [],
  EXPIRED:             [],
};

function assertTransition(currentStatus, targetStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${targetStatus}. Allowed from ${currentStatus}: ${allowed.join(', ') || 'none'}`
    );
  }
}

/**
 * Generate a unique PO number.
 * Format: FPO-YYYYMM-XXXXX (e.g. FPO-202608-00001)
 */
async function generatePoNumber() {
  const now   = new Date();
  const ym    = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `FPO-${ym}-`;
  const last  = await FpoOrder.findOne({ po_number: { $regex: `^${prefix}` } })
    .sort({ po_number: -1 })
    .select('po_number')
    .lean();
  const seq = last ? parseInt(last.po_number.split('-')[2], 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(5, '0')}`;
}

// ── 1. CREATE DRAFT ───────────────────────────────────────────────────────────
/**
 * Create a PO draft after full eligibility and quantity validation.
 *
 * @param {object} params
 * @param {string|ObjectId} params.franchisee_id
 * @param {Array}  params.items - [{kit_id|product_id, project_type_id, industry_type_id, item_name, quantity, unit_price_paise, gst_rate}]
 * @param {string} [params.idempotency_key] - caller-provided dedup key
 * @param {string} [params.payment_terms]
 * @param {string|ObjectId} [params.actor_id]
 * @param {object} [params.req]
 */
async function createPoDraft({ franchisee_id, items, idempotency_key, payment_terms, actor_id, req }) {
  // Idempotency check
  if (idempotency_key) {
    const existing = await FpoOrder.findOne({ idempotency_key }).lean();
    if (existing) {
      return { created: false, already_exists: true, order: existing };
    }
  }

  const franchisee = await Reseller.findOne({ _id: franchisee_id, deleted_at: null }).lean();
  if (!franchisee) throw new Error('Franchisee account not found.');
  if (franchisee.activation_status !== 'active') throw new Error('Franchisee account is not active.');
  if (!['kyc_verified', 'agreement_pending', 'territory_pending', 'active'].includes(franchisee.reseller_lifecycle_status)) {
    throw new Error('Franchisee KYC and onboarding must be completed before placing PO orders.');
  }

  // Active plan subscription
  const subscription = await ResellerPlanSubscription.findOne({
    reseller_id: franchisee_id,
    status: 'active',
  })
    .sort({ start_date: -1 })
    .lean();
  if (!subscription) throw new Error('No active plan subscription found for this franchisee.');

  const plan_id = subscription.plan_id;

  // PO settings check
  const allPlanPoSettings = await FranchiseePlanPoSetting.find({
    plan_id,
    is_active: true,
    po_enabled: true,
    deleted_at: null,
  }).lean();

  if (!allPlanPoSettings || allPlanPoSettings.length === 0) {
    throw new Error('PO ordering is not enabled for your current plan.');
  }

  const po_settings = allPlanPoSettings[0];

  // Validate that items are authorized under the plan's PO settings
  const authorizedKitIds = new Set();
  allPlanPoSettings.forEach((s) => {
    (s.allowed_combo_kit_ids || []).forEach((id) => authorizedKitIds.add(String(id)));
  });
  (subscription.plan_id?.allowed_combo_kit_ids || []).forEach((id) => authorizedKitIds.add(String(id)));

  if (authorizedKitIds.size > 0) {
    for (const item of items) {
      if (item.kit_id && !authorizedKitIds.has(String(item.kit_id))) {
        throw new Error(`The selected product "${item.item_name || 'Solar Kit'}" is not assigned for Purchase Orders under your franchise plan.`);
      }
    }
  }

  // Validate all items
  if (!Array.isArray(items) || items.length === 0) throw new Error('PO must contain at least one item.');
  if (po_settings.max_line_items && items.length > po_settings.max_line_items) {
    throw new Error(`Your plan allows a maximum of ${po_settings.max_line_items} line items per PO.`);
  }

  const validationResults = await validatePoItems(items, plan_id, po_settings);
  const failures = validationResults.filter((r) => !r.valid);
  if (failures.length > 0) {
    throw new Error(failures.map((f) => `Item "${f.item_name}": ${f.reason}`).join('; '));
  }

  // Build line items with snapshots
  let subtotal_paise = 0;
  let tax_total_paise = 0;
  const builtItems = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const moq_rule = validationResults[i].moq_rule;

    const tax_paise = Math.round((item.unit_price_paise || 0) * item.quantity * ((item.gst_rate || 0) / 100));
    const total_price_paise = (item.unit_price_paise || 0) * item.quantity + tax_paise;

    subtotal_paise  += (item.unit_price_paise || 0) * item.quantity;
    tax_total_paise += tax_paise;

    // Commission snapshot
    const commissionRule = await resolveCommissionRule(plan_id);
    let commission_method   = null;
    let commission_snapshot = 0;
    if (commissionRule) {
      commission_method = commissionRule.commission_method;
      commission_snapshot = commissionRule.commission_method === 'FIXED_PER_KIT'
        ? (commissionRule.fixed_amount_per_kit_paise || 0)
        : (commissionRule.commission_percentage || 0) * 100; // stored as percentage×100 for clarity
    }

    builtItems.push({
      project_type_id:      item.project_type_id || null,
      project_type_name:    item.project_type_name || null,
      kit_id:               item.kit_id || null,
      product_id:           item.product_id || null,
      item_name:            item.item_name,
      item_code:            item.item_code || null,
      quantity:             item.quantity,
      epc_allocations:      Array.isArray(item.epc_allocations) ? item.epc_allocations : [],
      moq_snapshot: moq_rule ? {
        moq:                moq_rule.moq,
        increment_quantity: moq_rule.increment_quantity,
        max_quantity:       moq_rule.max_quantity,
        rule_id:            moq_rule._id,
      } : null,
      unit_price_paise:     item.unit_price_paise || 0,
      gst_rate:             item.gst_rate || 0,
      tax_paise,
      total_price_paise,
      commission_method,
      commission_snapshot,
      contributes_to_target: po_settings.contributes_to_monthly_target !== false,
      returned_quantity:  0,
      cancelled_quantity: 0,
      delivered_quantity: 0,
    });
  }

  const grand_total_paise = subtotal_paise + tax_total_paise;
  const po_number = await generatePoNumber();
  const ikey = idempotency_key || `${franchisee_id}-${Date.now()}`;

  const commissionRule = await resolveCommissionRule(plan_id);

  const po_validity_days = po_settings.po_validity_days || 30;
  const expires_at = new Date(Date.now() + po_validity_days * 24 * 60 * 60 * 1000);

  const order = await FpoOrder.create({
    po_number,
    idempotency_key: ikey,
    franchisee_id,
    plan_id,
    plan_snapshot:     subscription,
    po_settings_snapshot: po_settings,
    industry_type_id:  items[0]?.industry_type_id || null,
    items: builtItems,
    subtotal_paise,
    tax_total_paise,
    grand_total_paise,
    payment_terms:    payment_terms || po_settings.payment_terms || 'FULL_ADVANCE',
    advance_percentage: po_settings.advance_percentage || 0,
    status: 'DRAFT',
    status_history: [{ status: 'DRAFT', changed_by: actor_id, actor_type: actor_id ? 'reseller' : 'system', note: 'PO Draft Created', changed_at: new Date() }],
    requires_approval:  po_settings.requires_approval !== false,
    commission_rule_id: commissionRule?._id || null,
    commission_rule_snapshot: commissionRule || null,
    expires_at,
    created_by: actor_id,
    updated_by: actor_id,
  });

  return { created: true, already_exists: false, order };
}

// ── 2. TRANSITION STATUS ──────────────────────────────────────────────────────
async function _transitionStatus(po_id, targetStatus, { changed_by, actor_type = 'cms_user', note = null, extra_update = {} }) {
  const order = await FpoOrder.findById(po_id);
  if (!order) throw new Error(`PO "${po_id}" not found`);

  assertTransition(order.status, targetStatus);

  const now = new Date();
  order.status = targetStatus;
  order.status_history.push({ status: targetStatus, changed_by, actor_type, note, changed_at: now });
  order.updated_by = changed_by;

  Object.assign(order, extra_update);
  await order.save();
  return order;
}

// ── 3. SUBMIT PO ─────────────────────────────────────────────────────────────
async function submitPo({ po_id, franchisee_id, actor_id, req }) {
  const order = await FpoOrder.findOne({ _id: po_id, franchisee_id, deleted_at: null }).lean();
  if (!order) throw new Error('PO not found or access denied.');

  const target = order.requires_approval ? 'PENDING_APPROVAL' : 'APPROVED';
  const updated = await _transitionStatus(po_id, target, {
    changed_by: actor_id, actor_type: 'reseller', note: 'PO submitted by franchisee',
  });

  await logAudit({ actor_type: 'reseller', actor_id, action: 'FPO_SUBMITTED', entity_type: 'fpo_orders', entity_id: po_id, after_snapshot: { status: target }, req });
  return updated;
}

// ── 4. APPROVE PO ────────────────────────────────────────────────────────────
async function approvePo({ po_id, admin_id, notes, req }) {
  const updated = await _transitionStatus(po_id, 'APPROVED', {
    changed_by: admin_id, actor_type: 'cms_user', note: notes || 'Approved by admin',
    extra_update: { approved_by: admin_id, approved_at: new Date(), approval_notes: notes || null },
  });

  const awaiting = await _transitionStatus(po_id, 'AWAITING_PAYMENT', {
    changed_by: admin_id, actor_type: 'cms_user', note: 'Moved to awaiting payment',
  });

  await logAudit({ actor_type: 'cms_user', actor_id: admin_id, action: 'FPO_APPROVED', entity_type: 'fpo_orders', entity_id: po_id, after_snapshot: { status: 'AWAITING_PAYMENT' }, req });
  return awaiting;
}

// ── 5. REJECT PO ─────────────────────────────────────────────────────────────
async function rejectPo({ po_id, admin_id, reason, req }) {
  const updated = await _transitionStatus(po_id, 'REJECTED', {
    changed_by: admin_id, actor_type: 'cms_user', note: reason,
    extra_update: { rejected_by: admin_id, rejected_at: new Date(), approval_notes: reason },
  });

  await logAudit({ actor_type: 'cms_user', actor_id: admin_id, action: 'FPO_REJECTED', entity_type: 'fpo_orders', entity_id: po_id, after_snapshot: { status: 'REJECTED', reason }, req });
  return updated;
}

// ── 6. CONFIRM PAYMENT ───────────────────────────────────────────────────────
async function confirmPayment({ po_id, payment_reference, razorpay_payment_id, admin_id, req }) {
  const updated = await _transitionStatus(po_id, 'PAID', {
    changed_by: admin_id, actor_type: 'cms_user', note: `Payment confirmed: ${payment_reference || razorpay_payment_id}`,
    extra_update: {
      payment_reference:   payment_reference || razorpay_payment_id,
      razorpay_payment_id: razorpay_payment_id || null,
    },
  });

  await logAudit({ actor_type: 'cms_user', actor_id: admin_id, action: 'FPO_PAYMENT_CONFIRMED', entity_type: 'fpo_orders', entity_id: po_id, after_snapshot: { status: 'PAID' }, req });
  return updated;
}

// ── 7. DISPATCH PO ────────────────────────────────────────────────────────────
async function dispatchPo({ po_id, admin_id, req }) {
  const updated = await _transitionStatus(po_id, 'DISPATCHED', {
    changed_by: admin_id, actor_type: 'cms_user', note: 'Order dispatched',
    extra_update: { dispatch_date: new Date() },
  });

  await logAudit({ actor_type: 'cms_user', actor_id: admin_id, action: 'FPO_DISPATCHED', entity_type: 'fpo_orders', entity_id: po_id, after_snapshot: { status: 'DISPATCHED' }, req });
  return updated;
}

// ── 8. DELIVER PO ─────────────────────────────────────────────────────────────
async function deliverPo({ po_id, delivered_items, admin_id, req }) {
  const order = await FpoOrder.findById(po_id);
  if (!order) throw new Error(`PO "${po_id}" not found`);

  // Update delivered quantities per line item
  if (Array.isArray(delivered_items) && delivered_items.length > 0) {
    for (const d of delivered_items) {
      const item = order.items.id(d.item_id);
      if (item) item.delivered_quantity = Math.min(d.delivered_quantity, item.quantity);
    }
  } else {
    // Full delivery assumed
    order.items.forEach((item) => { item.delivered_quantity = item.quantity; });
  }

  order.delivery_date = new Date();
  order.goal_counted = true;
  order.goal_counted_qty = order.items.reduce((s, i) => s + (i.delivered_quantity || 0), 0);
  await _transitionStatus(po_id, 'DELIVERED', {
    changed_by: admin_id, actor_type: 'cms_user', note: 'Order delivered',
    extra_update: { delivery_date: new Date(), goal_counted: true },
  });
  await order.save();

  // Trigger goal progress recalculation
  const now = new Date();
  await recalculateProgress({
    franchisee_id: order.franchisee_id,
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
    actor_id: admin_id,
    req,
  });

  // Post commission if applicable
  await postCommission({ fpo_order_id: po_id, actor_id: admin_id, req }).catch((err) => {
    console.error('[franchisee.po.service] commission post error (non-fatal):', err.message);
  });

  await logAudit({ actor_type: 'cms_user', actor_id: admin_id, action: 'FPO_DELIVERED', entity_type: 'fpo_orders', entity_id: po_id, after_snapshot: { status: 'DELIVERED' }, req });
  return order;
}

// ── 9. CANCEL PO ──────────────────────────────────────────────────────────────
async function cancelPo({ po_id, reason, cancelled_by, actor_type = 'cms_user', req }) {
  const order = await FpoOrder.findById(po_id).lean();
  if (!order) throw new Error(`PO "${po_id}" not found`);

  const updated = await _transitionStatus(po_id, 'CANCELLED', {
    changed_by: cancelled_by, actor_type, note: reason,
    extra_update: { cancellation_reason: reason, cancelled_by, cancelled_at: new Date() },
  });

  // Reverse commission if already posted
  if (order.commission_posted) {
    const totalQty = order.items.reduce((s, i) => s + (i.delivered_quantity || i.quantity), 0);
    await reverseCommission({ fpo_order_id: po_id, returned_kit_quantity: totalQty, reason: `PO Cancelled: ${reason}`, actor_id: cancelled_by, req }).catch(() => {});
  }

  // Recalculate goal
  const now = new Date();
  await recalculateProgress({ franchisee_id: order.franchisee_id, month: now.getMonth() + 1, year: now.getFullYear(), req }).catch(() => {});

  await logAudit({ actor_type, actor_id: cancelled_by, action: 'FPO_CANCELLED', entity_type: 'fpo_orders', entity_id: po_id, after_snapshot: { status: 'CANCELLED', reason }, req });
  return updated;
}

// ── 10. RETURN ITEMS ──────────────────────────────────────────────────────────
async function returnItems({ po_id, return_items, reason, actor_id, req }) {
  const order = await FpoOrder.findById(po_id);
  if (!order) throw new Error(`PO "${po_id}" not found`);

  if (!['DELIVERED', 'COMPLETED'].includes(order.status)) {
    throw new Error('Returns can only be processed for delivered orders.');
  }

  let totalReturned = 0;
  for (const r of return_items) {
    const item = order.items.id(r.item_id);
    if (!item) continue;
    const maxReturnable = (item.delivered_quantity || item.quantity) - (item.returned_quantity || 0);
    const returnQty = Math.min(r.quantity, maxReturnable);
    item.returned_quantity = (item.returned_quantity || 0) + returnQty;
    totalReturned += returnQty;
  }

  order.updated_by = actor_id;
  await order.save();

  // Reverse commission proportionally
  if (order.commission_posted && totalReturned > 0) {
    await reverseCommission({ fpo_order_id: po_id, returned_kit_quantity: totalReturned, reason, actor_id, req }).catch(() => {});
  }

  // Recalculate goal
  const now = new Date();
  await recalculateProgress({ franchisee_id: order.franchisee_id, month: now.getMonth() + 1, year: now.getFullYear(), req }).catch(() => {});

  await logAudit({ actor_type: 'cms_user', actor_id, action: 'FPO_RETURN_PROCESSED', entity_type: 'fpo_orders', entity_id: po_id, after_snapshot: { return_items, totalReturned, reason }, req });
  return order;
}

module.exports = {
  createPoDraft,
  submitPo,
  approvePo,
  rejectPo,
  confirmPayment,
  dispatchPo,
  deliverPo,
  cancelPo,
  returnItems,
  generatePoNumber,
  ALLOWED_TRANSITIONS,
};
