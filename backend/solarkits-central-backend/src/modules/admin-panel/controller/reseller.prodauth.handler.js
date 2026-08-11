/**
 * reseller.prodauth.handler.js
 *
 * Admin controller for Reseller Product Authorization Matrix.
 * Phase 4 — Reseller Management System
 *
 * Pattern: { status: "success"|"error", data, message }
 */

const mongoose = require('mongoose');
const { Reseller, ResellerProductAuthorization } = require('../models/india_solarshop_db');
const { evaluateResellerProductAuthorization } = require('../utils/product.authorization.service');
const { logAudit } = require('../utils/audit.service');

// ─── 1. LIST PRODUCT AUTHORIZATIONS FOR RESELLER ──────────────────────────────
/**
 * GET /admin-api/reseller-mgmt/product-auth/list/:id
 */
const list_product_authorizations = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid reseller ID is required' });
    }

    const rows = await ResellerProductAuthorization.find({ reseller_id: id })
      .populate('category_id', 'name')
      .populate('subcategory_id', 'name')
      .populate('product_id', 'name sku_code')
      .populate('kit_id', 'kit_name kit_code')
      .populate('assigned_by', 'name email')
      .sort({ created_at: -1 })
      .lean();

    const data = rows.map((r) => ({
      id:              r._id,
      reseller_id:     r.reseller_id,
      scope_type:      r.scope_type,
      category:        r.category_id,
      subcategory:     r.subcategory_id,
      product:         r.product_id,
      kit:             r.kit_id,
      is_authorized:   r.is_authorized,
      source:          r.source,
      override_reason: r.override_reason,
      assigned_by:     r.assigned_by,
      effective_date:  r.effective_date,
      status:          r.status,
      created_at:      r.created_at,
    }));

    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('[reseller.prodauth] list_product_authorizations error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 2. ASSIGN PRODUCT AUTHORIZATION RULE ─────────────────────────────────────
/**
 * POST /admin-api/reseller-mgmt/product-auth/assign/:id
 * Body: { scope_type, category_id?, subcategory_id?, product_id?, kit_id?, is_authorized?, override_reason? }
 */
const assign_product_authorization = async (req, res) => {
  try {
    const { id } = req.params;
    const { scope_type, category_id, subcategory_id, product_id, kit_id, is_authorized, override_reason } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid reseller ID is required' });
    }

    if (!scope_type || !['all', 'category', 'subcategory', 'product', 'kit'].includes(scope_type)) {
      return res.status(400).json({ status: 'error', message: 'scope_type must be all, category, subcategory, product, or kit' });
    }

    if (scope_type === 'category' && !category_id) {
      return res.status(400).json({ status: 'error', message: 'category_id required for category scope' });
    }
    if (scope_type === 'subcategory' && !subcategory_id) {
      return res.status(400).json({ status: 'error', message: 'subcategory_id required for subcategory scope' });
    }
    if (scope_type === 'product' && !product_id) {
      return res.status(400).json({ status: 'error', message: 'product_id required for product scope' });
    }
    if (scope_type === 'kit' && !kit_id) {
      return res.status(400).json({ status: 'error', message: 'kit_id required for kit scope' });
    }

    const reseller = await Reseller.findOne({ _id: id, deleted_at: null });
    if (!reseller) return res.status(404).json({ status: 'error', message: 'Reseller not found' });

    const rule = await ResellerProductAuthorization.create({
      reseller_id:     id,
      scope_type,
      category_id:    category_id || null,
      subcategory_id: subcategory_id || null,
      product_id:     product_id || null,
      kit_id:         kit_id || null,
      is_authorized:  is_authorized !== undefined ? Boolean(is_authorized) : true,
      source:         'admin_override',
      assigned_by:    req.user?.id || null,
      override_reason: override_reason ? override_reason.trim() : null,
      status:         'active',
    });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'RESELLER_PRODUCT_AUTH_ASSIGN',
      entity_type: 'reseller_product_authorizations',
      entity_id: rule._id,
      after_snapshot: rule.toObject(),
      req,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Product authorization rule assigned',
      data: rule,
    });
  } catch (error) {
    console.error('[reseller.prodauth] assign_product_authorization error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 3. REVOKE AUTHORIZATION RULE ─────────────────────────────────────────────
/**
 * PUT /admin-api/reseller-mgmt/product-auth/revoke/:rule_id
 */
const revoke_product_authorization = async (req, res) => {
  try {
    const { rule_id } = req.params;
    if (!rule_id || !mongoose.Types.ObjectId.isValid(rule_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid rule_id is required' });
    }

    const rule = await ResellerProductAuthorization.findById(rule_id);
    if (!rule) return res.status(404).json({ status: 'error', message: 'Rule not found' });

    rule.status = 'revoked';
    await rule.save();

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'RESELLER_PRODUCT_AUTH_REVOKE',
      entity_type: 'reseller_product_authorizations',
      entity_id: rule_id,
      after_snapshot: { status: 'revoked' },
      req,
    });

    return res.json({ status: 'success', message: 'Authorization rule revoked' });
  } catch (error) {
    console.error('[reseller.prodauth] revoke_product_authorization error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 4. CHECK PRODUCT AUTH STATUS ─────────────────────────────────────────────
/**
 * GET /admin-api/reseller-mgmt/product-auth/check-auth/:id?category_id=...&subcategory_id=...&product_id=...&kit_id=...
 */
const check_product_auth = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, subcategory_id, product_id, kit_id } = req.query;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid reseller ID is required' });
    }

    const check = await evaluateResellerProductAuthorization(id, {
      category_id,
      subcategory_id,
      product_id,
      kit_id,
    });

    return res.json({ status: 'success', data: check });
  } catch (error) {
    console.error('[reseller.prodauth] check_product_auth error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  list_product_authorizations,
  assign_product_authorization,
  revoke_product_authorization,
  check_product_auth,
};
