/**
 * reseller.pricing.service.js
 *
 * Reseller Catalog Pricing, MAP Enforcement & Server-Side Checkout Calculation Service.
 * Phase R7 — Reseller Management System
 *
 * Strict Integer Paise Financial Accounting (1 INR = 100 Paise).
 */

const {
  Reseller,
  ResellerListing,
  ResellerPricingRule,
  WarehouseComboKit,
  SolarShopSettings,
} = require('../models/india_solarshop_db');
const { Product } = require('../models/core_db');
const { logAudit } = require('../utils/audit.service');

/**
 * Calculate cost price, MAP price, and commission for a specific catalog item and reseller.
 */
async function calculateResellerItemPricing(resellerId, itemType, productId, kitId) {
  const reseller = await Reseller.findOne({ _id: resellerId, deleted_at: null }).lean();
  if (!reseller) throw new Error(`Reseller "${resellerId}" not found`);

  let item = null;
  let baseCostPaise = 0;

  if (itemType === 'product' && productId) {
    item = await Product.findById(productId).lean();
    if (item) baseCostPaise = Math.round((item.base_price || item.price || 0) * 100);
  } else if (itemType === 'kit' && kitId) {
    item = await WarehouseComboKit.findById(kitId).lean();
    if (item) baseCostPaise = Math.round((item.base_price || item.price || 0) * 100);
  }

  // Look for matching ResellerPricingRule by precedence:
  // reseller > reseller_type > product/kit > global
  const query = { status: 'active' };
  const rules = await ResellerPricingRule.find(query).lean();

  let matchedRule = null;
  for (const r of rules) {
    if (r.scope_type === 'reseller' && String(r.reseller_id) === String(resellerId)) {
      matchedRule = r; break;
    }
    if (r.scope_type === 'reseller_type' && String(r.reseller_type_id) === String(reseller.reseller_type_id)) {
      matchedRule = r; break;
    }
    if (r.scope_type === 'product' && productId && String(r.product_id) === String(productId)) {
      matchedRule = r; break;
    }
    if (r.scope_type === 'kit' && kitId && String(r.kit_id) === String(kitId)) {
      matchedRule = r; break;
    }
    if (r.scope_type === 'global' && !matchedRule) {
      matchedRule = r;
    }
  }

  const mapPricePaise = matchedRule?.map_price_paise != null
    ? matchedRule.map_price_paise
    : Math.round(baseCostPaise * 1.05); // Default MAP = 5% over cost

  const maxPricePaise = matchedRule?.max_markup_pct != null
    ? Math.round(baseCostPaise * (1 + matchedRule.max_markup_pct / 100))
    : Math.round(baseCostPaise * 2.0); // Default max = 100% markup

  const commissionPct = matchedRule?.default_commission_pct != null
    ? matchedRule.default_commission_pct
    : 5.0; // Default 5% platform commission

  return {
    item_type: itemType,
    product_id: productId || null,
    kit_id: kitId || null,
    cost_price_paise: baseCostPaise,
    map_price_paise: mapPricePaise,
    max_price_paise: maxPricePaise,
    platform_commission_pct: commissionPct,
  };
}

/**
 * Create or update a Reseller Listing with MAP enforcement check.
 */
async function createOrUpdateResellerListing({
  reseller_id,
  item_type,
  product_id = null,
  kit_id = null,
  selling_price_paise,
  allow_map_override = false,
  status = 'active',
  actor_id = null,
  req = null,
}) {
  const sellingPrice = parseInt(selling_price_paise, 10);
  if (isNaN(sellingPrice) || sellingPrice <= 0) {
    throw new Error('selling_price_paise must be a positive integer in paise');
  }

  const pricing = await calculateResellerItemPricing(reseller_id, item_type, product_id, kit_id);
  const isMapCompliant = sellingPrice >= pricing.map_price_paise;

  // MAP Enforcement
  if (!isMapCompliant && !allow_map_override) {
    return {
      success: false,
      code: 'MAP_VIOLATION',
      message: `Selling price (${sellingPrice / 100} INR) is below Minimum Advertised Price (${pricing.map_price_paise / 100} INR).`,
      map_price_paise: pricing.map_price_paise,
      requested_price_paise: sellingPrice,
    };
  }

  const filter = { reseller_id, item_type };
  if (product_id) filter.product_id = product_id;
  if (kit_id) filter.kit_id = kit_id;

  const update = {
    reseller_id,
    item_type,
    product_id: product_id || null,
    kit_id: kit_id || null,
    cost_price_paise: pricing.cost_price_paise,
    map_price_paise: pricing.map_price_paise,
    max_price_paise: pricing.max_price_paise,
    selling_price_paise: sellingPrice,
    platform_commission_pct: pricing.platform_commission_pct,
    is_map_compliant: isMapCompliant,
    status,
    updated_by: actor_id,
  };

  const listing = await ResellerListing.findOneAndUpdate(
    filter,
    { $set: update, $setOnInsert: { created_by: actor_id } },
    { new: true, upsert: true }
  );

  await logAudit({
    actor_type: actor_id ? 'cms_user' : 'reseller',
    actor_id: actor_id || reseller_id,
    action: 'RESELLER_LISTING_UPDATE',
    entity_type: 'reseller_listings',
    entity_id: listing._id,
    after_snapshot: { selling_price_paise: sellingPrice, is_map_compliant: isMapCompliant },
    req,
  });

  return { success: true, listing };
}

/**
 * Server-side price calculation for EPC cart checkout (never trust client-supplied totals).
 */
async function calculateCheckoutPrice(resellerId, items = []) {
  let settings = await SolarShopSettings.findOne().lean();
  const gstRate = settings?.gst_rate || 13.8;

  let subtotalPaise = 0;
  let taxTotalPaise = 0;
  const processedItems = [];

  for (const item of items) {
    const qty = parseInt(item.quantity, 10) || 1;
    const filter = { reseller_id: resellerId, status: 'active' };
    if (item.product_id) filter.product_id = item.product_id;
    if (item.kit_id) filter.kit_id = item.kit_id;

    const listing = await ResellerListing.findOne(filter).lean();
    if (!listing) {
      throw new Error(`Item ${item.product_id || item.kit_id} is not listed for this reseller storefront.`);
    }

    const unitPricePaise = listing.selling_price_paise;
    const itemSubtotal = qty * unitPricePaise;
    const itemTax = Math.round(itemSubtotal * (gstRate / 100));

    subtotalPaise += itemSubtotal;
    taxTotalPaise += itemTax;

    processedItems.push({
      item_type: listing.item_type,
      product_id: listing.product_id,
      kit_id: listing.kit_id,
      quantity: qty,
      unit_price_paise: unitPricePaise,
      tax_paise: itemTax,
      total_price_paise: itemSubtotal + itemTax,
      platform_commission_pct: listing.platform_commission_pct,
    });
  }

  const shippingFeePaise = 0;
  const grandTotalPaise = subtotalPaise + taxTotalPaise + shippingFeePaise;

  return {
    reseller_id: resellerId,
    items: processedItems,
    subtotal_paise: subtotalPaise,
    tax_total_paise: taxTotalPaise,
    shipping_fee_paise: shippingFeePaise,
    grand_total_paise: grandTotalPaise,
    gst_rate: gstRate,
  };
}

module.exports = {
  calculateResellerItemPricing,
  createOrUpdateResellerListing,
  calculateCheckoutPrice,
};
