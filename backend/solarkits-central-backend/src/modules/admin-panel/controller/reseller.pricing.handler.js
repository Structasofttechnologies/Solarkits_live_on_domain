/**
 * reseller.pricing.handler.js
 *
 * Handler for Reseller Listings, MAP Pricing Rules & Commission Controls.
 * Phase R7 — Reseller Management System
 *
 * Pattern: { status: "success"|"error", data, message }
 */

const mongoose = require('mongoose');
const { ResellerListing, ResellerPricingRule, WarehouseComboKit } = require('../models/india_solarshop_db');
const { Product } = require('../models/core_db');
const {
  calculateResellerItemPricing,
  createOrUpdateResellerListing,
} = require('../services/reseller.pricing.service');
const { logAudit } = require('../utils/audit.service');

// ─── 1. LIST RESELLER LISTINGS ────────────────────────────────────────────────
/**
 * GET /api/india/v1/reseller/listings OR /admin-api/reseller-mgmt/listings/:id
 */
const list_reseller_listings = async (req, res) => {
  try {
    const resellerId = req.reseller?._id || req.params.id || req.query.reseller_id;
    if (!resellerId || !mongoose.Types.ObjectId.isValid(resellerId)) {
      return res.status(400).json({ status: 'error', message: 'Valid reseller ID is required' });
    }

    const rows = await ResellerListing.find({ reseller_id: resellerId })
      .populate('product_id', 'name sku_code base_price')
      .populate('kit_id', 'kit_name kit_code base_price')
      .sort({ created_at: -1 })
      .lean();

    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('[reseller.pricing] list_reseller_listings error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 2. CREATE / UPDATE RESELLER LISTING ──────────────────────────────────────
/**
 * POST /api/india/v1/reseller/listings OR /admin-api/reseller-mgmt/listings
 * Body: { reseller_id?, item_type, product_id?, kit_id?, selling_price_paise, allow_map_override?, status? }
 */
const upsert_reseller_listing = async (req, res) => {
  try {
    const resellerId = req.reseller?._id || req.body.reseller_id;
    const { item_type, product_id, kit_id, selling_price_paise, allow_map_override, status } = req.body;

    if (!resellerId || !mongoose.Types.ObjectId.isValid(resellerId)) {
      return res.status(400).json({ status: 'error', message: 'Valid reseller_id is required' });
    }
    if (!item_type || !['product', 'kit'].includes(item_type)) {
      return res.status(400).json({ status: 'error', message: 'item_type must be product or kit' });
    }

    const result = await createOrUpdateResellerListing({
      reseller_id: resellerId,
      item_type,
      product_id: product_id || null,
      kit_id: kit_id || null,
      selling_price_paise,
      allow_map_override: Boolean(allow_map_override),
      status: status || 'active',
      actor_id: req.user?.id || req.reseller?._id || null,
      req,
    });

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        code: result.code,
        message: result.message,
        map_price_paise: result.map_price_paise,
        requested_price_paise: result.requested_price_paise,
      });
    }

    return res.json({
      status: 'success',
      message: 'Reseller storefront listing updated successfully',
      data: result.listing,
    });
  } catch (error) {
    console.error('[reseller.pricing] upsert_reseller_listing error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

// ─── 3. LIST PRICING RULES (Admin) ────────────────────────────────────────────
/**
 * GET /admin-api/reseller-mgmt/pricing-rules
 */
const list_pricing_rules = async (req, res) => {
  try {
    const rules = await ResellerPricingRule.find({ status: 'active' })
      .populate('reseller_id', 'business_name email')
      .populate('product_id', 'name sku_code')
      .populate('kit_id', 'kit_name kit_code')
      .sort({ created_at: -1 })
      .lean();

    return res.json({ status: 'success', data: rules });
  } catch (error) {
    console.error('[reseller.pricing] list_pricing_rules error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 4. CREATE PRICING RULE (Admin) ───────────────────────────────────────────
/**
 * POST /admin-api/reseller-mgmt/pricing-rules
 * Body: { scope_type, reseller_type_id?, reseller_id?, category_id?, product_id?, kit_id?, min_margin_pct?, max_markup_pct?, default_commission_pct?, map_price_paise? }
 */
const create_pricing_rule = async (req, res) => {
  try {
    const {
      scope_type,
      reseller_type_id,
      reseller_id,
      category_id,
      product_id,
      kit_id,
      min_margin_pct,
      max_markup_pct,
      default_commission_pct,
      map_price_paise,
    } = req.body;

    if (!scope_type || !['global', 'reseller_type', 'reseller', 'category', 'product', 'kit'].includes(scope_type)) {
      return res.status(400).json({ status: 'error', message: 'Valid scope_type is required' });
    }

    const rule = await ResellerPricingRule.create({
      scope_type,
      reseller_type_id: reseller_type_id || null,
      reseller_id: reseller_id || null,
      category_id: category_id || null,
      product_id: product_id || null,
      kit_id: kit_id || null,
      min_margin_pct: min_margin_pct != null ? Number(min_margin_pct) : 0,
      max_markup_pct: max_markup_pct != null ? Number(max_markup_pct) : 100,
      default_commission_pct: default_commission_pct != null ? Number(default_commission_pct) : 5,
      map_price_paise: map_price_paise != null ? Number(map_price_paise) : null,
      status: 'active',
      created_by: req.user?.id || null,
    });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'RESELLER_PRICING_RULE_CREATE',
      entity_type: 'reseller_pricing_rules',
      entity_id: rule._id,
      after_snapshot: rule.toObject(),
      req,
    });

    return res.status(201).json({ status: 'success', message: 'Pricing rule created successfully', data: rule });
  } catch (error) {
    console.error('[reseller.pricing] create_pricing_rule error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 5. DELETE PRICING RULE (Admin) ───────────────────────────────────────────
/**
 * DELETE /admin-api/reseller-mgmt/pricing-rules/:id
 */
const delete_pricing_rule = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid rule ID is required' });
    }

    const rule = await ResellerPricingRule.findByIdAndUpdate(id, { $set: { status: 'inactive' } });
    if (!rule) return res.status(404).json({ status: 'error', message: 'Rule not found' });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'RESELLER_PRICING_RULE_DELETE',
      entity_type: 'reseller_pricing_rules',
      entity_id: id,
      before_snapshot: rule.toObject(),
      req,
    });

    return res.json({ status: 'success', message: 'Pricing rule deleted successfully' });
  } catch (error) {
    console.error('[reseller.pricing] delete_pricing_rule error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  list_reseller_listings,
  upsert_reseller_listing,
  list_pricing_rules,
  create_pricing_rule,
  delete_pricing_rule,
};
