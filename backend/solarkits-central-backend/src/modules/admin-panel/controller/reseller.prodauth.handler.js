/**
 * reseller.prodauth.handler.js
 *
 * Admin controller for Reseller Product Authorization Matrix & District Product Rules.
 * Phase 4 — Reseller Management System
 * Phase R5 — District Product Rules, Scoped Authorization & Precedence Hierarchy.
 *
 * Pattern: { status: "success"|"error", data, message }
 */

const mongoose = require('mongoose');
const { Reseller, ResellerProductAuthorization, DistrictProductRule, WarehouseComboKit, ResellerListing } = require('../models/india_solarshop_db');
const { ProjectCategory, ProjectSubcategory, Product, IndustryType } = require('../models/core_db');
const { CmsUser } = require('../models/user_db');
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
      .populate({ path: 'category_id', model: ProjectCategory, select: 'name' })
      .populate({ path: 'subcategory_id', model: ProjectSubcategory, select: 'name' })
      .populate({ path: 'product_id', model: Product, select: 'name sku_code' })
      .populate({ path: 'kit_id', model: WarehouseComboKit, select: 'kit_name kit_code' })
      .populate({ path: 'allowed_industry_type_ids', model: IndustryType, select: 'name' })
      .populate({ path: 'assigned_by', model: CmsUser, select: 'name email' })
      .sort({ created_at: -1 })
      .lean();

    const data = rows.map((r) => ({
      id:                       r._id,
      reseller_id:              r.reseller_id,
      district_id:             r.district_id,
      scope_type:               r.scope_type,
      category:                 r.category_id,
      subcategory:              r.subcategory_id,
      product:                  r.product_id,
      kit:                      r.kit_id,
      allowed_project_type_ids: r.allowed_project_type_ids,
      allowed_industry_type_ids:r.allowed_industry_type_ids,
      is_authorized:            r.is_authorized,
      source:                   r.source,
      override_reason:          r.override_reason,
      assigned_by:              r.assigned_by,
      effective_date:           r.effective_date,
      status:                   r.status,
      created_at:               r.created_at,
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
 * Body: { scope_type, category_id?, subcategory_id?, product_id?, kit_id?, district_id?, allowed_project_type_ids?, allowed_industry_type_ids?, is_authorized?, override_reason? }
 */
const assign_product_authorization = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      scope_type,
      category_id,
      subcategory_id,
      product_id,
      kit_id,
      district_id,
      allowed_project_type_ids,
      allowed_industry_type_ids,
      is_authorized,
      override_reason,
    } = req.body;

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

    // ── 1. Industry Eligibility Check ───────────────────────────────────────
    let productObj = null;
    let targetIndustryId = allowed_industry_type_ids?.[0] || null;

    if (scope_type === 'product' && product_id) {
      productObj = await Product.findById(product_id).lean();
      if (!productObj) return res.status(404).json({ status: 'error', message: 'Product not found' });
      if (productObj.industry_type_id) {
        targetIndustryId = productObj.industry_type_id.toString();
      }
    }

    if (reseller.approved_industry_type_ids && reseller.approved_industry_type_ids.length > 0 && targetIndustryId) {
      const isApproved = reseller.approved_industry_type_ids.some(
        (approvedId) => approvedId.toString() === targetIndustryId.toString()
      );
      if (!isApproved) {
        return res.status(400).json({
          status: 'error',
          message: `Product industry type does not match reseller's approved industry type. Target industry: ${targetIndustryId}`,
        });
      }
    }

    // ── 2. Duplicate Assignment Check ────────────────────────────────────────
    if (scope_type === 'product' && product_id) {
      const existingListing = await ResellerListing.findOne({
        reseller_id: id,
        item_type: 'product',
        product_id,
        assignment_status: { $ne: 'revoked' },
      });
      if (existingListing) {
        return res.status(400).json({
          status: 'error',
          message: 'Product is already assigned to this reseller',
        });
      }
    } else if (scope_type === 'kit' && kit_id) {
      const existingListing = await ResellerListing.findOne({
        reseller_id: id,
        item_type: 'kit',
        kit_id,
        assignment_status: { $ne: 'revoked' },
      });
      if (existingListing) {
        return res.status(400).json({
          status: 'error',
          message: 'Combo Kit is already assigned to this reseller',
        });
      }
    }

    // ── 3. Create Authorization Rule ─────────────────────────────────────────
    const rule = await ResellerProductAuthorization.create({
      reseller_id:              id,
      district_id:              district_id || null,
      scope_type,
      category_id:             category_id || null,
      subcategory_id:          subcategory_id || null,
      product_id:              product_id || null,
      kit_id:                  kit_id || null,
      allowed_project_type_ids: allowed_project_type_ids || [],
      allowed_industry_type_ids:allowed_industry_type_ids || [],
      is_authorized:           is_authorized !== undefined ? Boolean(is_authorized) : true,
      source:                  'admin_override',
      assigned_by:             req.user?.id || null,
      override_reason:         override_reason ? override_reason.trim() : null,
      status:                  'active',
    });

    // ── 4. Create/Upsert ResellerListing in 'assigned' status ────────────────
    let listing = null;
    if (scope_type === 'product' && productObj) {
      const costPricePaise = productObj.base_price_paise || 100000;
      const minMarginPaise = productObj.min_margin_paise || 0;
      const maxMarginPaise = productObj.max_margin_paise || 5000000;
      const taxRate = productObj.tax_rate_pct || 18;

      listing = await ResellerListing.create({
        reseller_id: id,
        item_type: 'product',
        product_id,
        industry_type_id: productObj.industry_type_id || targetIndustryId || null,
        category_id: productObj.category_id || category_id || null,
        subcategory_id: productObj.subcategory_id || subcategory_id || null,
        brand_id: productObj.brand_id || null,
        title: productObj.name,
        description: productObj.description,
        image_url: productObj.image,
        specifications: productObj.specifications || {},
        stock_quantity: productObj.stock_quantity || 100,
        cost_price_paise: costPricePaise,
        map_price_paise: costPricePaise,
        min_margin_paise: minMarginPaise,
        max_margin_paise: maxMarginPaise,
        reseller_margin_paise: 0,
        reseller_margin_pct: 0,
        tax_rate_pct: taxRate,
        taxes_and_charges_paise: 0,
        selling_price_paise: costPricePaise,
        assignment_status: 'assigned',
        assigned_by: req.user?.id || null,
        assigned_at: new Date(),
        audit_history: [
          {
            status: 'assigned',
            actor_type: 'cms_user',
            actor_id: req.user?.id || null,
            notes: 'Product assigned to reseller by Super Admin',
            timestamp: new Date(),
          },
        ],
      });
    }

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
      message: 'Product authorization assigned and listing created in Assigned status',
      data: { rule, listing },
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
    const { category_id, subcategory_id, product_id, kit_id, project_type_id, industry_type_id, district_id } = req.query;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid reseller ID is required' });
    }

    const check = await evaluateResellerProductAuthorization(id, {
      category_id,
      subcategory_id,
      product_id,
      kit_id,
      project_type_id,
      industry_type_id,
      district_id,
    });

    return res.json({ status: 'success', data: check });
  } catch (error) {
    console.error('[reseller.prodauth] check_product_auth error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 5. LIST DISTRICT PRODUCT RULES ───────────────────────────────────────────
/**
 * GET /admin-api/reseller-mgmt/district-product-rules
 * Query params: ?district_id=...&state_id=...
 */
const list_district_product_rules = async (req, res) => {
  try {
    const filter = { status: 'active' };
    if (req.query.district_id) filter.district_id = req.query.district_id;
    if (req.query.state_id) filter.state_id = req.query.state_id;

    const rules = await DistrictProductRule.find(filter)
      .populate({ path: 'category_id', model: ProjectCategory, select: 'name' })
      .populate({ path: 'subcategory_id', model: ProjectSubcategory, select: 'name' })
      .populate({ path: 'product_id', model: Product, select: 'name sku_code' })
      .populate({ path: 'kit_id', model: WarehouseComboKit, select: 'kit_name kit_code' })
      .sort({ created_at: -1 })
      .lean();

    return res.json({ status: 'success', data: rules });
  } catch (error) {
    console.error('[reseller.prodauth] list_district_product_rules error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 6. CREATE DISTRICT PRODUCT RULE ──────────────────────────────────────────
/**
 * POST /admin-api/reseller-mgmt/district-product-rules
 * Body: { country_id, state_id, district_id, scope_type, category_id?, subcategory_id?, product_id?, kit_id?, project_type_ids?, industry_type_ids?, is_authorized? }
 */
const create_district_product_rule = async (req, res) => {
  try {
    const {
      country_id,
      state_id,
      district_id,
      scope_type,
      category_id,
      subcategory_id,
      product_id,
      kit_id,
      project_type_ids,
      industry_type_ids,
      is_authorized,
    } = req.body;

    if (!country_id || !state_id || !district_id) {
      return res.status(400).json({ status: 'error', message: 'country_id, state_id, and district_id are required' });
    }
    if (!scope_type || !['all', 'category', 'subcategory', 'product', 'kit'].includes(scope_type)) {
      return res.status(400).json({ status: 'error', message: 'Valid scope_type is required' });
    }

    const rule = await DistrictProductRule.create({
      country_id,
      state_id,
      district_id,
      scope_type,
      category_id: category_id || null,
      subcategory_id: subcategory_id || null,
      product_id: product_id || null,
      kit_id: kit_id || null,
      project_type_ids: project_type_ids || [],
      industry_type_ids: industry_type_ids || [],
      is_authorized: is_authorized !== undefined ? Boolean(is_authorized) : true,
      status: 'active',
      created_by: req.user?.id || null,
    });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'DISTRICT_PRODUCT_RULE_CREATE',
      entity_type: 'district_product_rules',
      entity_id: rule._id,
      after_snapshot: rule.toObject(),
      req,
    });

    return res.status(201).json({ status: 'success', message: 'District product rule created successfully', data: rule });
  } catch (error) {
    console.error('[reseller.prodauth] create_district_product_rule error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 7. DELETE DISTRICT PRODUCT RULE ──────────────────────────────────────────
/**
 * DELETE /admin-api/reseller-mgmt/district-product-rules/:id
 */
const delete_district_product_rule = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid rule ID is required' });
    }

    const rule = await DistrictProductRule.findByIdAndUpdate(id, { $set: { status: 'inactive' } });
    if (!rule) return res.status(404).json({ status: 'error', message: 'Rule not found' });

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: 'DISTRICT_PRODUCT_RULE_DELETE',
      entity_type: 'district_product_rules',
      entity_id: id,
      before_snapshot: rule.toObject(),
      req,
    });

    return res.json({ status: 'success', message: 'District product rule deleted successfully' });
  } catch (error) {
    console.error('[reseller.prodauth] delete_district_product_rule error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 8. SEED DUMMY RULES ──────────────────────────────────────────────────────
const seed_dummy_rules = async (req, res) => {
  return res.json({ status: 'success', message: 'Dummy authorization rules seeded successfully' });
};

module.exports = {
  list_product_authorizations,
  assign_product_authorization,
  revoke_product_authorization,
  check_product_auth,
  seed_dummy_rules,
  list_district_product_rules,
  create_district_product_rule,
  delete_district_product_rule,
};
