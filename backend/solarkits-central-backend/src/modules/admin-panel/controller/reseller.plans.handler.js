/**
 * reseller.plans.handler.js
 *
 * Admin CRUD for Reseller Plans (reseller_plans collection).
 * Phase 2 — Reseller Management System
 *
 * Pattern: { status: "success"|"error", data, message }
 */

const mongoose = require('mongoose');
const { ResellerPlan, ResellerPlanSubscription } = require('../models/india_solarshop_db');
const { logAudit } = require('../utils/audit.service');

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ─── 1. LIST ──────────────────────────────────────────────────────────────────
/**
 * GET /admin-api/resellers/plans/list
 */
const list_reseller_plans = async (req, res) => {
  try {
    const { territory_level, active_only } = req.query;
    const query = { deleted_at: null };

    if (territory_level && ['district', 'state', 'country'].includes(territory_level)) {
      query.territory_level = territory_level;
    }
    if (active_only === 'true') query.is_active = true;

    const rows = await ResellerPlan.find(query)
      .sort({ sort_order: 1, name: 1 })
      .lean();

    const data = rows.map((r) => ({
      id:                        r._id,
      name:                      r.name,
      slug:                      r.slug,
      territory_level:           r.territory_level,
      one_time_fee:              r.one_time_fee,
      currency:                  r.currency,
      validity_value:            r.validity_value,
      validity_unit:             r.validity_unit,
      allowed_territories_count: r.allowed_territories_count,
      renewal_rules:             r.renewal_rules,
      allowed_project_types:     r.allowed_project_type_ids || [],
      allowed_industry_types:    r.allowed_industry_type_ids || [],
      allowed_categories:        r.allowed_category_ids || [],
      description:               r.description,
      sort_order:                r.sort_order,
      is_active:                 r.is_active,
      created_at:                r.created_at,
    }));

    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('[reseller.plans] list_reseller_plans error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 2. ADD ───────────────────────────────────────────────────────────────────
/**
 * POST /admin-api/resellers/plans/add
 */
const add_reseller_plan = async (req, res) => {
  try {
    const {
      name,
      territory_level,
      one_time_fee,
      currency,
      validity_value,
      validity_unit,
      allowed_territories_count,
      renewal_rules,
      allowed_project_type_ids,
      allowed_industry_type_ids,
      allowed_category_ids,
      description,
      sort_order,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'name is required' });
    }
    if (!territory_level || !['district', 'state', 'country'].includes(territory_level)) {
      return res.status(400).json({ status: 'error', message: 'territory_level must be district, state, or country' });
    }

    const slug = slugify(name);

    const existing = await ResellerPlan.findOne({
      $or: [{ slug }, { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } }],
      deleted_at: null,
    });
    if (existing) {
      return res.status(409).json({ status: 'error', message: `Plan "${existing.name}" already exists` });
    }

    const doc = await ResellerPlan.create({
      name:                      name.trim(),
      slug,
      territory_level,
      one_time_fee:              one_time_fee != null ? Number(one_time_fee) : 0,
      currency:                  currency ? currency.trim().toUpperCase() : 'INR',
      validity_value:            validity_value != null ? Number(validity_value) : 1,
      validity_unit:             validity_unit || 'years',
      allowed_territories_count: allowed_territories_count != null ? Number(allowed_territories_count) : 1,
      renewal_rules:             renewal_rules || { auto_renew: false, grace_period_days: 15 },
      allowed_project_type_ids:  Array.isArray(allowed_project_type_ids) ? allowed_project_type_ids : [],
      allowed_industry_type_ids: Array.isArray(allowed_industry_type_ids) ? allowed_industry_type_ids : [],
      allowed_category_ids:      Array.isArray(allowed_category_ids) ? allowed_category_ids : [],
      description:               description ? description.trim() : null,
      sort_order:                sort_order != null ? Number(sort_order) : 0,
      created_by:                req.user?.id || null,
      updated_by:                req.user?.id || null,
    });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'RESELLER_PLAN_CREATE',
      entity_type: 'reseller_plans',
      entity_id: doc._id,
      after_snapshot: doc.toObject(),
      req,
    });

    return res.status(201).json({ status: 'success', data: { id: doc._id, name: doc.name, slug: doc.slug } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'Plan name or slug already exists' });
    }
    console.error('[reseller.plans] add_reseller_plan error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 3. UPDATE ────────────────────────────────────────────────────────────────
/**
 * PUT /admin-api/resellers/plans/update
 */
const update_reseller_plan = async (req, res) => {
  try {
    const { id, name, ...fields } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid id is required' });
    }

    const doc = await ResellerPlan.findOne({ _id: id, deleted_at: null });
    if (!doc) {
      return res.status(404).json({ status: 'error', message: 'Reseller plan not found' });
    }

    const beforeSnapshot = doc.toObject();
    const updateData = {};

    if (name && name.trim()) {
      const newSlug = slugify(name.trim());
      const conflict = await ResellerPlan.findOne({
        _id: { $ne: id },
        $or: [{ slug: newSlug }, { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } }],
        deleted_at: null,
      });
      if (conflict) {
        return res.status(409).json({ status: 'error', message: `Another plan already has the name "${conflict.name}"` });
      }
      updateData.name = name.trim();
      updateData.slug = newSlug;
    }

    if (fields.territory_level && ['district', 'state', 'country'].includes(fields.territory_level)) {
      updateData.territory_level = fields.territory_level;
    }
    if (fields.one_time_fee != null) updateData.one_time_fee = Number(fields.one_time_fee);
    if (fields.validity_value != null) updateData.validity_value = Number(fields.validity_value);
    if (fields.validity_unit && ['months', 'years'].includes(fields.validity_unit)) {
      updateData.validity_unit = fields.validity_unit;
    }
    if (fields.allowed_territories_count != null) {
      updateData.allowed_territories_count = Number(fields.allowed_territories_count);
    }
    if (fields.renewal_rules) updateData.renewal_rules = fields.renewal_rules;
    if (Array.isArray(fields.allowed_project_type_ids)) updateData.allowed_project_type_ids = fields.allowed_project_type_ids;
    if (Array.isArray(fields.allowed_industry_type_ids)) updateData.allowed_industry_type_ids = fields.allowed_industry_type_ids;
    if (Array.isArray(fields.allowed_category_ids)) updateData.allowed_category_ids = fields.allowed_category_ids;
    if (fields.description !== undefined) updateData.description = fields.description ? fields.description.trim() : null;
    if (fields.sort_order != null) updateData.sort_order = Number(fields.sort_order);
    updateData.updated_by = req.user?.id || null;

    const result = await ResellerPlan.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'RESELLER_PLAN_UPDATE',
      entity_type: 'reseller_plans',
      entity_id: id,
      before_snapshot: beforeSnapshot,
      after_snapshot: result,
      req,
    });

    return res.json({ status: 'success', data: { id: result._id, name: result.name } });
  } catch (error) {
    console.error('[reseller.plans] update_reseller_plan error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 4. TOGGLE STATUS ────────────────────────────────────────────────────────
/**
 * PUT /admin-api/resellers/plans/toggle-status
 */
const toggle_reseller_plan_status = async (req, res) => {
  try {
    const { id, is_active } = req.body;

    if (!id || typeof is_active !== 'boolean') {
      return res.status(400).json({ status: 'error', message: 'Valid id and boolean is_active required' });
    }

    const doc = await ResellerPlan.findOne({ _id: id, deleted_at: null });
    if (!doc) return res.status(404).json({ status: 'error', message: 'Plan not found' });

    doc.is_active = is_active;
    doc.updated_by = req.user?.id || null;
    await doc.save();

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: is_active ? 'RESELLER_PLAN_ACTIVATE' : 'RESELLER_PLAN_DEACTIVATE',
      entity_type: 'reseller_plans',
      entity_id: id,
      after_snapshot: { is_active: doc.is_active },
      req,
    });

    return res.json({ status: 'success', message: `Plan "${doc.name}" is now ${is_active ? 'active' : 'inactive'}` });
  } catch (error) {
    console.error('[reseller.plans] toggle_reseller_plan_status error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 5. SOFT DELETE ───────────────────────────────────────────────────────────
/**
 * DELETE /admin-api/resellers/plans/delete
 */
const delete_reseller_plan = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) return res.status(400).json({ status: 'error', message: 'id is required' });

    const doc = await ResellerPlan.findOne({ _id: id, deleted_at: null });
    if (!doc) return res.status(404).json({ status: 'error', message: 'Plan not found' });

    // Block deletion if active subscriptions exist
    const activeSubCount = await ResellerPlanSubscription.countDocuments({ plan_id: id, status: 'active' });
    if (activeSubCount > 0) {
      return res.status(409).json({
        status: 'error',
        message: `Cannot delete: Plan "${doc.name}" has ${activeSubCount} active reseller subscription(s). Deactivate the plan instead.`,
      });
    }

    doc.deleted_at = new Date();
    doc.is_active = false;
    doc.updated_by = req.user?.id || null;
    await doc.save();

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'RESELLER_PLAN_DELETE',
      entity_type: 'reseller_plans',
      entity_id: id,
      req,
    });

    return res.json({ status: 'success', message: `Plan "${doc.name}" deleted` });
  } catch (error) {
    console.error('[reseller.plans] delete_reseller_plan error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  list_reseller_plans,
  add_reseller_plan,
  update_reseller_plan,
  toggle_reseller_plan_status,
  delete_reseller_plan,
};
