'use strict';

const mongoose = require('mongoose');

class PricingEngine {
  /**
   * Calculate prices, discounts, MOQ compliance, and GST for a set of items
   * @param {Object} context
   * @param {Array} context.items - Array of { product_id, quantity, custom_price_paise }
   * @param {string} context.buyer_type - 'distributor' | 'dealer' | 'guest'
   * @param {string} context.buyer_id - ID of distributor or dealer
   * @param {string} [context.origin_state_code] - State code where shipment originates (default: 'GJ' / Gujarat)
   * @param {string} [context.destination_state_code] - State code where goods are shipped
   * @param {string} [context.plan_code] - Franchise plan code for tier-based margin
   * @returns {Promise<Object>} Calculated price breakdown
   */
  static async calculate(context = {}) {
    const {
      items = [],
      buyer_type = 'guest',
      buyer_id = null,
      origin_state_code = 'GJ',
      destination_state_code = 'GJ',
      plan_code = null,
    } = context;

    if (!Array.isArray(items) || items.length === 0) {
      return {
        items: [],
        summary: {
          subtotal_paise: 0,
          total_discount_paise: 0,
          net_taxable_paise: 0,
          cgst_paise: 0,
          sgst_paise: 0,
          igst_paise: 0,
          total_tax_paise: 0,
          shipping_paise: 0,
          grand_total_paise: 0,
          grand_total_inr: 0,
          is_interstate: origin_state_code !== destination_state_code,
        },
        moq_errors: [],
      };
    }

    const Product = mongoose.model('products');
    const BoskitPriceRule = mongoose.model('boskit_price_rules');

    // Fetch products
    const productIds = items.map((i) => i.product_id).filter(Boolean);
    const productDocs = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(productDocs.map((p) => [p._id.toString(), p]));

    // Fetch applicable active price rules
    const now = new Date();
    const activeRules = await BoskitPriceRule.find({
      is_active: true,
      $or: [{ start_date: null }, { start_date: { $lte: now } }],
      $and: [{ $or: [{ end_date: null }, { end_date: { $gte: now } }] }],
    })
      .sort({ priority: -1 })
      .lean();

    const isInterstate = origin_state_code?.toUpperCase() !== destination_state_code?.toUpperCase();

    let subtotalPaise = 0;
    let totalDiscountPaise = 0;
    let netTaxablePaise = 0;
    let totalCgstPaise = 0;
    let totalSgstPaise = 0;
    let totalIgstPaise = 0;
    let totalTaxPaise = 0;
    const moqErrors = [];

    const calculatedItems = items.map((item, index) => {
      const prod = productMap.get(item.product_id?.toString()) || {};
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

      // Base MRP resolution (integer paise)
      const baseMrpPaise = prod.mrp_paise || (prod.price ? Math.round(prod.price * 100) : 999900);
      const moq = prod.min_order_qty || (buyer_type === 'distributor' ? 5 : buyer_type === 'dealer' ? 2 : 1);

      // Check MOQ
      if (quantity < moq) {
        moqErrors.push({
          product_id: item.product_id,
          product_name: prod.name || `Item #${index + 1}`,
          ordered_qty: quantity,
          min_order_qty: moq,
          message: `Minimum order quantity for ${prod.name || 'item'} is ${moq} units.`,
        });
      }

      // Role discount percent evaluation
      let discountPercent = 0;
      if (buyer_type === 'distributor') {
        discountPercent = 25; // 25% Distributor master wholesale margin
      } else if (buyer_type === 'dealer') {
        discountPercent = 18; // 18% Dealer wholesale rate
      } else {
        discountPercent = 5; // 5% Standard B2B catalogue discount
      }

      // Volume slab discount
      if (quantity >= 50) {
        discountPercent += 5; // Additional 5% for bulk container lots
      } else if (quantity >= 20) {
        discountPercent += 3;
      }

      // Custom rule override if present
      const matchedRule = activeRules.find(
        (r) =>
          (!r.target_role || r.target_role === 'all' || r.target_role === buyer_type) &&
          (!r.category_id || r.category_id.toString() === prod.category_id?.toString()) &&
          (!r.min_quantity || quantity >= r.min_quantity)
      );

      if (matchedRule?.discount_percent) {
        discountPercent = Math.max(discountPercent, matchedRule.discount_percent);
      }

      // Unit calculations
      const unitMrpPaise = baseMrpPaise;
      const unitDiscountPaise = Math.round((unitMrpPaise * discountPercent) / 100);
      const unitNetPaise = Math.max(0, unitMrpPaise - unitDiscountPaise);

      const lineBaseTotalPaise = unitMrpPaise * quantity;
      const lineDiscountTotalPaise = unitDiscountPaise * quantity;
      const lineTaxablePaise = unitNetPaise * quantity;

      // GST Resolution (Default: 12% solar equipment rate)
      const gstRate = 12; // 12% GST standard on renewable equipment
      const lineTaxAmountPaise = Math.round((lineTaxablePaise * gstRate) / 100);

      let lineCgstPaise = 0;
      let lineSgstPaise = 0;
      let lineIgstPaise = 0;

      if (isInterstate) {
        lineIgstPaise = lineTaxAmountPaise;
      } else {
        lineCgstPaise = Math.round(lineTaxAmountPaise / 2);
        lineSgstPaise = lineTaxAmountPaise - lineCgstPaise; // ensure exact integer sum
      }

      const lineGrandTotalPaise = lineTaxablePaise + lineTaxAmountPaise;

      // Accumulate
      subtotalPaise += lineBaseTotalPaise;
      totalDiscountPaise += lineDiscountTotalPaise;
      netTaxablePaise += lineTaxablePaise;
      totalCgstPaise += lineCgstPaise;
      totalSgstPaise += lineSgstPaise;
      totalIgstPaise += lineIgstPaise;
      totalTaxPaise += lineTaxAmountPaise;

      return {
        product_id: item.product_id,
        product_name: prod.name || 'Solar Equipment Component',
        sku: prod.sku || `BK-SKU-${index + 1}`,
        quantity,
        moq,
        moq_met: quantity >= moq,
        unit_mrp_paise: unitMrpPaise,
        unit_discount_paise: unitDiscountPaise,
        unit_net_paise: unitNetPaise,
        discount_percent: discountPercent,
        line_base_total_paise: lineBaseTotalPaise,
        line_discount_paise: lineDiscountTotalPaise,
        line_taxable_paise: lineTaxablePaise,
        gst_rate_percent: gstRate,
        cgst_paise: lineCgstPaise,
        sgst_paise: lineSgstPaise,
        igst_paise: lineIgstPaise,
        total_tax_paise: lineTaxAmountPaise,
        line_grand_total_paise: lineGrandTotalPaise,
        line_grand_total_inr: Math.round(lineGrandTotalPaise / 100),
      };
    });

    const shippingPaise = netTaxablePaise > 5000000 ? 0 : 250000; // Free shipping above ₹50,000 net, else ₹2,500
    const grandTotalPaise = netTaxablePaise + totalTaxPaise + shippingPaise;

    return {
      items: calculatedItems,
      summary: {
        subtotal_paise: subtotalPaise,
        subtotal_inr: Math.round(subtotalPaise / 100),
        total_discount_paise: totalDiscountPaise,
        total_discount_inr: Math.round(totalDiscountPaise / 100),
        net_taxable_paise: netTaxablePaise,
        net_taxable_inr: Math.round(netTaxablePaise / 100),
        cgst_paise: totalCgstPaise,
        cgst_inr: Math.round(totalCgstPaise / 100),
        sgst_paise: totalSgstPaise,
        sgst_inr: Math.round(totalSgstPaise / 100),
        igst_paise: totalIgstPaise,
        igst_inr: Math.round(totalIgstPaise / 100),
        total_tax_paise: totalTaxPaise,
        total_tax_inr: Math.round(totalTaxPaise / 100),
        shipping_paise: shippingPaise,
        shipping_inr: Math.round(shippingPaise / 100),
        grand_total_paise: grandTotalPaise,
        grand_total_inr: Math.round(grandTotalPaise / 100),
        is_interstate: isInterstate,
        origin_state_code,
        destination_state_code,
        buyer_type,
      },
      moq_passed: moqErrors.length === 0,
      moq_errors: moqErrors,
    };
  }
}

module.exports = PricingEngine;
