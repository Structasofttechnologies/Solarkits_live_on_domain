/**
 * warehouse.bifurcation.service.js
 *
 * "According Order Type Fulfillment" Engine.
 * Responsibilities:
 * 1. Normalize and identify Order Types ('po_order', 'loose_order', 'trial_order').
 * 2. Hierarchical Warehouse Resolution:
 *    - District Level Match -> Cluster Master Match -> State Master Match -> Central Hub Fallback.
 * 3. Match warehouse capabilities (order_fulfillment_types).
 */

const mongoose = require('mongoose');
const { CompanyWarehouse } = require('../models/company_warehouse_db');
const { GeoLevel1, GeoLevel2 } = require('../models/geolocation_db');

const VALID_ORDER_TYPES = ['po_order', 'loose_order', 'trial_order'];

/**
 * Normalizes any incoming order type string or item list into one of 3 canonical types:
 * 'po_order' | 'loose_order' | 'trial_order'
 */
function normalizeOrderType(rawType, items = []) {
  if (!rawType && Array.isArray(items)) {
    if (items.some(it => it && (it.is_trial_kit || (it.item_name && /trial/i.test(it.item_name))))) {
      return 'trial_order';
    }
    if (items.some(it => it && (it.order_type === 'loose' || it.is_loose_order || it.order_type === 'loose_kit_order'))) {
      return 'loose_order';
    }
  }

  const str = String(rawType || '').toLowerCase().trim();
  if (str === 'trial_order' || str === 'trial' || str === 'is_trial') {
    return 'trial_order';
  }
  if (str === 'loose_order' || str === 'loose' || str === 'loose_kit_order' || str === 'loose_order_quantities') {
    return 'loose_order';
  }
  if (str === 'po_order' || str === 'bulk_po' || str === 'combine_po_order' || str === 'po') {
    return 'po_order';
  }

  // Check items as fallback
  if (Array.isArray(items) && items.length > 0) {
    if (items.some(it => it && (it.is_trial_kit || (it.item_name && /trial/i.test(it.item_name))))) {
      return 'trial_order';
    }
    if (items.some(it => it && (it.order_type === 'loose' || it.is_loose_order))) {
      return 'loose_order';
    }
  }

  return 'po_order';
}

/**
 * Resolves the optimal warehouse for an order based on order type capability and geolocation.
 *
 * Hierarchy:
 * 1. District Level: Warehouse in exact district supporting order_type
 * 2. Cluster Level: Master or sub warehouse in the same cluster supporting order_type
 * 3. State Level: Master warehouse in the same state supporting order_type
 * 4. Fallback Level: National central master warehouse supporting order_type
 *
 * @param {Object} params
 * @param {string|ObjectId} [params.district_id]
 * @param {string|ObjectId} [params.state_id]
 * @param {string|ObjectId} [params.cluster_id]
 * @param {string} [params.order_type] - 'po_order' | 'loose_order' | 'trial_order'
 * @param {Array} [params.items] - Order items for fallback detection
 * @returns {Promise<Object>} Resolved warehouse and bifurcation metadata snapshot
 */
async function resolveFulfillmentWarehouse({ district_id, state_id, cluster_id, order_type = 'po_order', items = [] }) {
  const normalizedType = normalizeOrderType(order_type, items);

  const capabilityQuery = {
    is_active: true,
    deleted_at: null,
    $or: [
      { order_fulfillment_types: normalizedType },
      { order_fulfillment_types: { $size: 0 } }, // backward compatibility if empty array
      { order_fulfillment_types: { $exists: false } } // backward compatibility if not set
    ]
  };

  let resolvedWh = null;
  let matchedLevel = null;
  let matchedReason = '';

  // ── Step 1: Local District Check ───────────────────────────────────────────
  if (district_id && mongoose.Types.ObjectId.isValid(district_id)) {
    resolvedWh = await CompanyWarehouse.findOne({
      level_2: new mongoose.Types.ObjectId(district_id),
      ...capabilityQuery
    }).lean();

    if (resolvedWh) {
      matchedLevel = 'district';
      matchedReason = `Matched local district warehouse (${resolvedWh.warehouse_code}) authorized for ${normalizedType}`;
    }
  }

  // ── Step 2: Cluster Master / Sub Warehouse Check ───────────────────────────
  if (!resolvedWh) {
    let resolvedClusterId = cluster_id;
    if (!resolvedClusterId && district_id && mongoose.Types.ObjectId.isValid(district_id)) {
      try {
        const districtDoc = await GeoLevel2.findById(district_id).lean();
        if (districtDoc && districtDoc.cluster) {
          resolvedClusterId = districtDoc.cluster;
        }
      } catch (err) {
        console.warn('[WarehouseBifurcation] Failed to fetch district cluster:', err.message);
      }
    }

    if (resolvedClusterId) {
      const clusterDistrictIds = await GeoLevel2.find({
        cluster: resolvedClusterId,
        deleted_at: null
      }).distinct('_id');

      if (clusterDistrictIds && clusterDistrictIds.length > 0) {
        // Try master warehouse in cluster first, then any sub warehouse
        resolvedWh = await CompanyWarehouse.findOne({
          level_2: { $in: clusterDistrictIds },
          ...capabilityQuery
        }).sort({ warehouse_type: 1 }).lean();

        if (resolvedWh) {
          matchedLevel = 'cluster';
          matchedReason = `Matched in-cluster warehouse (${resolvedWh.warehouse_code}) authorized for ${normalizedType}`;
        }
      }
    }
  }

  // ── Step 3: State Master Hub Check ────────────────────────────────────────
  if (!resolvedWh && state_id && mongoose.Types.ObjectId.isValid(state_id)) {
    resolvedWh = await CompanyWarehouse.findOne({
      level_1: new mongoose.Types.ObjectId(state_id),
      ...capabilityQuery
    }).sort({ warehouse_type: 1 }).lean();

    if (resolvedWh) {
      matchedLevel = 'state';
      matchedReason = `Matched state-level hub (${resolvedWh.warehouse_code}) authorized for ${normalizedType}`;
    }
  }

  // ── Step 4: Fallback to Central / National Hub with Capability Match ───────
  if (!resolvedWh) {
    resolvedWh = await CompanyWarehouse.findOne({
      ...capabilityQuery
    }).sort({ warehouse_type: 1, created_at: 1 }).lean();

    if (resolvedWh) {
      matchedLevel = 'fallback_central';
      matchedReason = `Assigned Central Hub (${resolvedWh.warehouse_code}) supporting ${normalizedType}`;
    }
  }

  // ── Step 5: Universal Emergency Safe Fallback ──────────────────────────────
  if (!resolvedWh) {
    resolvedWh = await CompanyWarehouse.findOne({
      is_active: true,
      deleted_at: null
    }).sort({ warehouse_type: 1 }).lean();

    if (resolvedWh) {
      matchedLevel = 'fallback_central';
      matchedReason = `Emergency fallback to warehouse (${resolvedWh.warehouse_code}) [Notice: Check warehouse capability configuration]`;
    }
  }

  return {
    warehouse: resolvedWh,
    assigned_warehouse_id: resolvedWh ? (resolvedWh._id || resolvedWh.id) : null,
    assigned_warehouse_code: resolvedWh ? resolvedWh.warehouse_code : null,
    order_type_matched: normalizedType,
    matched_level: matchedLevel,
    matched_reason: matchedReason
  };
}

module.exports = {
  VALID_ORDER_TYPES,
  normalizeOrderType,
  resolveFulfillmentWarehouse
};
