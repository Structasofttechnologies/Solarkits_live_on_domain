/**
 * franchisee.po.settings.handler.js
 *
 * Admin CRUD for Franchisee Plan PO Settings (franchisee_plan_po_settings collection).
 * Permission code: FPO_SETTINGS
 * Prefix: /admin-api/franchisee/po-settings
 */

const mongoose = require('mongoose');
const { FranchiseePlanPoSetting, ResellerPlan } = require('../models/india_solarshop_db');
const { logAudit } = require('../utils/audit.service');

// ── LIST ──────────────────────────────────────────────────────────────────────
const list_po_settings = async (req, res) => {
  try {
    const { plan_id, active_only } = req.query;
    const query = { deleted_at: null };
    if (plan_id) query.plan_id = plan_id;
    if (active_only === 'true') query.is_active = true;

    const rows = await FranchiseePlanPoSetting.find(query)
      .populate('plan_id', 'name territory_level')
      .sort({ created_at: -1 })
      .lean();

    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('[po.settings] list error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── ADD ───────────────────────────────────────────────────────────────────────
const add_po_settings = async (req, res) => {
  try {
    const { plan_id, po_enabled, min_po_quantity, max_po_quantity, allow_mixed_project_types, max_line_items,
      allowed_industry_type_ids, allowed_project_type_ids, allowed_category_ids, allowed_product_ids,
      allowed_territory_levels, po_validity_days, requires_approval, payment_terms, advance_percentage,
      credit_period_eligible, credit_period_days, cancellation_rules, amendment_rules,
      contributes_to_monthly_target, effective_from, effective_until } = req.body;

    if (!plan_id || !mongoose.Types.ObjectId.isValid(plan_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid plan_id is required' });
    }
    if (!effective_from) {
      return res.status(400).json({ status: 'error', message: 'effective_from date is required' });
    }

    const plan = await ResellerPlan.findOne({ _id: plan_id, deleted_at: null }).lean();
    if (!plan) return res.status(404).json({ status: 'error', message: 'Reseller plan not found' });

    const doc = await FranchiseePlanPoSetting.create({
      plan_id,
      po_enabled:                  Boolean(po_enabled),
      min_po_quantity:             min_po_quantity != null ? Number(min_po_quantity) : 1,
      max_po_quantity:             max_po_quantity != null ? Number(max_po_quantity) : null,
      allow_mixed_project_types:   allow_mixed_project_types !== false,
      max_line_items:              max_line_items != null ? Number(max_line_items) : 50,
      allowed_industry_type_ids:   Array.isArray(allowed_industry_type_ids) ? allowed_industry_type_ids : [],
      allowed_project_type_ids:    Array.isArray(allowed_project_type_ids) ? allowed_project_type_ids : [],
      allowed_category_ids:        Array.isArray(allowed_category_ids) ? allowed_category_ids : [],
      allowed_product_ids:         Array.isArray(allowed_product_ids) ? allowed_product_ids : [],
      allowed_territory_levels:    Array.isArray(allowed_territory_levels) ? allowed_territory_levels : [],
      po_validity_days:            po_validity_days != null ? Number(po_validity_days) : 30,
      requires_approval:           requires_approval !== false,
      payment_terms:               payment_terms || 'FULL_ADVANCE',
      advance_percentage:          advance_percentage != null ? Number(advance_percentage) : null,
      credit_period_eligible:      Boolean(credit_period_eligible),
      credit_period_days:          credit_period_days != null ? Number(credit_period_days) : 0,
      cancellation_rules:          cancellation_rules || {},
      amendment_rules:             amendment_rules || {},
      contributes_to_monthly_target: contributes_to_monthly_target !== false,
      effective_from:              new Date(effective_from),
      effective_until:             effective_until ? new Date(effective_until) : null,
      created_by:                  req.user?.id,
      updated_by:                  req.user?.id,
    });

    await logAudit({ actor_type: 'cms_user', actor_id: req.user?.id, action: 'FPO_SETTINGS_CREATE', entity_type: 'franchisee_plan_po_settings', entity_id: doc._id, after_snapshot: doc.toObject(), req });

    return res.status(201).json({ status: 'success', data: { id: doc._id } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ status: 'error', message: 'PO settings already exist for this plan and effective date. Use the update endpoint.' });
    console.error('[po.settings] add error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── UPDATE ────────────────────────────────────────────────────────────────────
const update_po_settings = async (req, res) => {
  try {
    const { id, ...fields } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid id is required' });
    }

    const doc = await FranchiseePlanPoSetting.findOne({ _id: id, deleted_at: null });
    if (!doc) return res.status(404).json({ status: 'error', message: 'PO settings not found' });

    const before = doc.toObject();
    const allowed = ['po_enabled', 'min_po_quantity', 'max_po_quantity', 'allow_mixed_project_types',
      'max_line_items', 'allowed_industry_type_ids', 'allowed_project_type_ids', 'allowed_category_ids',
      'allowed_product_ids', 'allowed_territory_levels', 'po_validity_days', 'requires_approval',
      'payment_terms', 'advance_percentage', 'credit_period_eligible', 'credit_period_days',
      'cancellation_rules', 'amendment_rules', 'contributes_to_monthly_target', 'effective_from', 'effective_until', 'is_active'];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        doc[key] = fields[key];
      }
    }
    doc.updated_by = req.user?.id;
    await doc.save();

    await logAudit({ actor_type: 'cms_user', actor_id: req.user?.id, action: 'FPO_SETTINGS_UPDATE', entity_type: 'franchisee_plan_po_settings', entity_id: id, before_snapshot: before, after_snapshot: doc.toObject(), req });

    return res.json({ status: 'success', data: { id: doc._id } });
  } catch (error) {
    console.error('[po.settings] update error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── TOGGLE STATUS ─────────────────────────────────────────────────────────────
const toggle_po_settings_status = async (req, res) => {
  try {
    const { id, is_active } = req.body;
    if (!id || typeof is_active !== 'boolean') {
      return res.status(400).json({ status: 'error', message: 'id and boolean is_active required' });
    }
    const doc = await FranchiseePlanPoSetting.findOne({ _id: id, deleted_at: null });
    if (!doc) return res.status(404).json({ status: 'error', message: 'PO settings not found' });
    doc.is_active = is_active;
    doc.updated_by = req.user?.id;
    await doc.save();
    return res.json({ status: 'success', message: `PO settings ${is_active ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('[po.settings] toggle error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ── SOFT DELETE ───────────────────────────────────────────────────────────────
const delete_po_settings = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ status: 'error', message: 'id is required' });
    const doc = await FranchiseePlanPoSetting.findOne({ _id: id, deleted_at: null });
    if (!doc) return res.status(404).json({ status: 'error', message: 'PO settings not found' });
    doc.deleted_at = new Date();
    doc.is_active = false;
    doc.updated_by = req.user?.id;
    await doc.save();
    await logAudit({ actor_type: 'cms_user', actor_id: req.user?.id, action: 'FPO_SETTINGS_DELETE', entity_type: 'franchisee_plan_po_settings', entity_id: id, req });
    return res.json({ status: 'success', message: 'PO settings deleted' });
  } catch (error) {
    console.error('[po.settings] delete error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = { list_po_settings, add_po_settings, update_po_settings, toggle_po_settings_status, delete_po_settings };
