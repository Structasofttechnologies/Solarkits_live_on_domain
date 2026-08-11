/**
 * reseller.checkout.handler.js
 *
 * Handler for Dual-Mode Reseller Checkout validation & Admin Order Tracking.
 * Phase 6 — Reseller Management System
 *
 * Pattern: { status: "success"|"error", data, message }
 */

const mongoose = require('mongoose');
const { PurchaseOrder, Reseller } = require('../models/india_solarshop_db');
const {
  validateResellerCheckoutGuards,
  calculateDualModeOrderPricing,
} = require('../utils/reseller.checkout.service');

// ─── 1. VALIDATE CHECKOUT ─────────────────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/checkout/validate
 * Body: { location: { country_id, state_id, district_id }, items: [...], selling_price, base_price }
 */
const validate_checkout = async (req, res) => {
  try {
    const resellerId = req.reseller._id;
    const { location, items, base_price, selling_price } = req.body;

    // 1. Guard Check
    const guards = await validateResellerCheckoutGuards({
      resellerId,
      location: location || {},
      items: items || [],
    });

    if (!guards.is_valid) {
      return res.status(422).json({
        status: 'error',
        message: 'Checkout validation failed',
        errors: guards.errors,
      });
    }

    // 2. Dual-mode Price Calculation
    const pricing = await calculateDualModeOrderPricing({
      resellerId,
      basePrice: base_price || 0,
      sellingPrice: selling_price || 0,
    });

    return res.json({
      status: 'success',
      message: 'Checkout validation successful',
      data: {
        is_valid: true,
        pricing,
        reseller: {
          id:              guards.reseller._id,
          business_name:   guards.reseller.business_name,
          commercial_mode: guards.reseller.commercial_mode,
        },
      },
    });
  } catch (error) {
    console.error('[reseller.checkout] validate_checkout error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

// ─── 2. ADMIN LIST RESELLER ORDERS ────────────────────────────────────────────
/**
 * GET /admin-api/reseller-mgmt/orders/list
 * Query: ?reseller_id=...&commercial_mode=...&status=...
 */
const list_reseller_orders = async (req, res) => {
  try {
    const { reseller_id, commercial_mode, status } = req.query;
    const query = { reseller_id: { $ne: null } };

    if (reseller_id && mongoose.Types.ObjectId.isValid(reseller_id)) {
      query.reseller_id = reseller_id;
    }
    if (commercial_mode && ['commission', 'dealer'].includes(commercial_mode)) {
      query.reseller_commercial_mode = commercial_mode;
    }
    if (status) query.status = status;

    const rows = await PurchaseOrder.find(query)
      .populate('reseller_id', 'business_name email mobile gst_number commercial_mode')
      .populate('country_id', 'name iso2')
      .populate('state_id', 'name state_code')
      .populate('warehouse_id', 'name warehouse_code')
      .sort({ created_at: -1 })
      .lean();

    const data = rows.map((r) => ({
      id:                         r._id,
      reseller:                   r.reseller_id,
      commercial_mode:            r.reseller_commercial_mode,
      selling_price_snapshot:     r.selling_price_snapshot,
      base_price_snapshot:        r.base_price_snapshot,
      reseller_commission_rate:   r.reseller_commission_rate,
      reseller_commission_amount: r.reseller_commission_amount,
      dealer_discount_amount:     r.dealer_discount_amount,
      dealer_invoice_number:      r.dealer_invoice_number,
      status:                     r.status,
      country:                    r.country_id,
      state:                      r.state_id,
      warehouse:                  r.warehouse_id,
      created_at:                 r.created_at,
    }));

    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('[reseller.checkout] list_reseller_orders error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  validate_checkout,
  list_reseller_orders,
};
