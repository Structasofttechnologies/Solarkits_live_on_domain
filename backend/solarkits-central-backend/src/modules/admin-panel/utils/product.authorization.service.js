/**
 * product.authorization.service.js
 *
 * Product Authorization Evaluator & Catalog Filter Engine.
 * Phase 4 — Reseller Management System
 *
 * Evaluation rules (in order of priority):
 *   1. Explicit Admin Blacklist rule (is_authorized: false) -> BLOCKED
 *   2. Explicit Admin Whitelist rule (is_authorized: true)  -> AUTHORIZED
 *   3. Active Plan Scope (allowed_category_ids, allowed_project_type_ids) -> AUTHORIZED if in scope
 *   4. Default -> BLOCKED if plan has specific scope restrictions
 */

const {
  Reseller,
  ResellerProductAuthorization,
  ResellerPlanSubscription,
} = require('../models/india_solarshop_db');

/**
 * Evaluate authorization for a single catalog item (product or solar kit).
 *
 * @param {string|ObjectId} resellerId
 * @param {object} item - { category_id, subcategory_id, product_id, kit_id }
 * @returns {Promise<object>} { is_authorized: boolean, source: string, reason: string }
 */
async function evaluateResellerProductAuthorization(resellerId, item = {}) {
  const reseller = await Reseller.findOne({ _id: resellerId, deleted_at: null }).lean();
  if (!reseller || reseller.activation_status !== 'active') {
    return { is_authorized: false, source: 'none', reason: 'Reseller account is not active' };
  }

  // 1. Fetch explicit product authorization rules for this reseller
  const rules = await ResellerProductAuthorization.find({
    reseller_id: resellerId,
    status: 'active',
  }).lean();

  // Check 1: Explicit Blacklist (is_authorized === false)
  for (const r of rules) {
    if (r.is_authorized === false) {
      if (r.scope_type === 'kit' && item.kit_id && String(r.kit_id) === String(item.kit_id)) {
        return { is_authorized: false, source: 'admin_override', reason: 'Kit is explicitly restricted by admin blacklist rule' };
      }
      if (r.scope_type === 'product' && item.product_id && String(r.product_id) === String(item.product_id)) {
        return { is_authorized: false, source: 'admin_override', reason: 'Product is explicitly restricted by admin blacklist rule' };
      }
      if (r.scope_type === 'subcategory' && item.subcategory_id && String(r.subcategory_id) === String(item.subcategory_id)) {
        return { is_authorized: false, source: 'admin_override', reason: 'Subcategory is restricted by admin blacklist rule' };
      }
      if (r.scope_type === 'category' && item.category_id && String(r.category_id) === String(item.category_id)) {
        return { is_authorized: false, source: 'admin_override', reason: 'Category is restricted by admin blacklist rule' };
      }
    }
  }

  // Check 2: Explicit Whitelist (is_authorized === true)
  for (const r of rules) {
    if (r.is_authorized === true) {
      if (r.scope_type === 'all') {
        return { is_authorized: true, source: 'admin_override', reason: 'Reseller authorized for all catalog items' };
      }
      if (r.scope_type === 'kit' && item.kit_id && String(r.kit_id) === String(item.kit_id)) {
        return { is_authorized: true, source: 'admin_override', reason: 'Kit authorized by explicit admin whitelist' };
      }
      if (r.scope_type === 'product' && item.product_id && String(r.product_id) === String(item.product_id)) {
        return { is_authorized: true, source: 'admin_override', reason: 'Product authorized by explicit admin whitelist' };
      }
      if (r.scope_type === 'subcategory' && item.subcategory_id && String(r.subcategory_id) === String(item.subcategory_id)) {
        return { is_authorized: true, source: 'admin_override', reason: 'Subcategory authorized by explicit admin whitelist' };
      }
      if (r.scope_type === 'category' && item.category_id && String(r.category_id) === String(item.category_id)) {
        return { is_authorized: true, source: 'admin_override', reason: 'Category authorized by explicit admin whitelist' };
      }
    }
  }

  // Check 3: Active Plan Default Scope
  const activeSub = await ResellerPlanSubscription.findOne({ reseller_id: resellerId, status: 'active' })
    .populate('plan_id')
    .lean();

  if (activeSub?.plan_id) {
    const plan = activeSub.plan_id;
    const allowedCats = (plan.allowed_category_ids || []).map(String);
    const allowedSubcats = (plan.allowed_project_type_ids || []).map(String);

    // If plan specifies allowed categories, enforce scope
    if (allowedCats.length > 0 && item.category_id && !allowedCats.includes(String(item.category_id))) {
      return { is_authorized: false, source: 'plan_default', reason: 'Category is outside plan subscription scope' };
    }
    if (allowedSubcats.length > 0 && item.subcategory_id && !allowedSubcats.includes(String(item.subcategory_id))) {
      return { is_authorized: false, source: 'plan_default', reason: 'Subcategory is outside plan subscription scope' };
    }

    return { is_authorized: true, source: 'plan_default', reason: 'Authorized under active plan scope' };
  }

  // Default fallback: allow access if no restrictions exist
  return { is_authorized: true, source: 'default', reason: 'Authorized by default' };
}

/**
 * Filter an array of catalog items for a reseller.
 */
async function filterCatalogForReseller(resellerId, items = []) {
  if (!items || !items.length) return [];

  const results = [];
  for (const item of items) {
    const check = await evaluateResellerProductAuthorization(resellerId, {
      category_id:    item.category_id || item.category || item.project_category,
      subcategory_id: item.subcategory_id || item.subcategory || item.project_subcategory,
      product_id:     item.product_id || item._id,
      kit_id:         item.kit_id || item._id,
    });

    if (check.is_authorized) {
      results.push(item);
    }
  }
  return results;
}

module.exports = {
  evaluateResellerProductAuthorization,
  filterCatalogForReseller,
};
