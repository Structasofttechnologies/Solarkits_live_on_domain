/**
 * epc.offline.checkout.service.js
 *
 * Comprehensive EPC Offline Checkout Engine:
 * 1. Pincode & Warehouse Stock Routing (Franchise Warehouse vs Company Warehouse).
 * 2. Offline Bank Transfer (RTGS / NEFT / IMPS / UPI) Order Creation with Receipt Upload.
 * 3. Accounts Verification Loop (Approve with Tax Invoice Generation vs Reject with Comment).
 * 4. EPC Re-submission of UTR & Payment Proof.
 * 5. Warehouse / Ops Packing & Dispatch Live Tracking.
 * 6. Franchise Partner Real-Time Visibility & Margin Settlement.
 */

const mongoose = require('mongoose');
const {
  EpcAccount,
  Reseller,
  EpcResellerRelationship,
  EpcOrder,
  EpcCheckoutLog,
  ResellerInventoryLedger,
  SolarShopSettings,
} = require('../models/india_solarshop_db');
const { calculateCheckoutPrice } = require('./reseller.pricing.service');
const { calculateCurrentItemStock } = require('./reseller.procurement.service');
const { routeEpcOrderToReseller } = require('./epc.order.service');
const { logAudit } = require('../utils/audit.service');
const { creditResellerMargin, creditEpcMargin } = require('./wallet.settlement.service');
const { resolveVariationCommission } = require('./franchisee.commission.service');

// Company Escrow Bank Account Details
const COMPANY_BANK_DETAILS = {
  account_name: 'SolarKits Technologies Pvt Ltd',
  bank_name: 'HDFC Bank',
  account_number: '50200088991122',
  ifsc_code: 'HDFC0001234',
  branch_name: 'Corporate Financial Center, Mumbai',
  account_type: 'Current Account',
  upi_id: 'solarkits.pay@hdfcbank',
  qr_code_url: '/assets/payments/solarkits_company_upi_qr.png',
  support_email: 'accounts@solarkits.com',
  support_phone: '+91 98765 43210',
};

/**
 * Generate unique EPC order number.
 */
function generateEpcOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-EPC-${dateStr}-${randomSuffix}`;
}

/**
 * Generate unique Tax Invoice number.
 */
function generateInvoiceNumber(orderId) {
  const year = new Date().getFullYear();
  const hexSuffix = String(orderId || Date.now()).slice(-5).toUpperCase();
  return `INV-SK-${year}-${hexSuffix}`;
}

/**
 * 1. Check Warehouse Stock by PIN Code & EPC Attribution
 */
async function checkWarehouseStockAvailability({
  epc_id,
  kit_id = null,
  product_id = null,
  quantity = 1,
  pincode = null,
  district_id = null,
}) {
  const qty = parseInt(quantity, 10) || 1;
  let targetResellerId = null;
  let resellerDoc = null;

  // 1. Resolve EPC Account & Franchise Partner attribution
  if (epc_id && mongoose.Types.ObjectId.isValid(epc_id)) {
    const epc = await EpcAccount.findById(epc_id).lean();
    if (epc) {
      if (epc.primary_reseller_id) {
        targetResellerId = epc.primary_reseller_id;
      } else if (epc.onboarded_by_reseller_id) {
        targetResellerId = epc.onboarded_by_reseller_id;
      } else {
        const activeRel = await EpcResellerRelationship.findOne({ epc_id: epc._id, status: 'active' }).lean();
        if (activeRel?.reseller_id) {
          targetResellerId = activeRel.reseller_id;
        }
      }
    }
  }

  if (targetResellerId) {
    resellerDoc = await Reseller.findOne({
      _id: targetResellerId,
      activation_status: 'active',
      deleted_at: null,
    }).lean();
  }

  // 2. Check Franchise Warehouse Stock first if franchise-attributed
  let franchiseStock = 0;
  if (resellerDoc) {
    const itemType = kit_id ? 'kit' : 'product';
    franchiseStock = await calculateCurrentItemStock(resellerDoc._id, itemType, product_id, kit_id);

    if (franchiseStock >= qty) {
      return {
        available: true,
        fulfillment_source: 'franchise_warehouse',
        warehouse_name: `${resellerDoc.business_name} (Authorized Franchise Hub)`,
        reseller_id: resellerDoc._id,
        reseller_name: resellerDoc.business_name,
        available_quantity: franchiseStock,
        requested_quantity: qty,
        estimated_delivery_days: '2-4 Business Days',
        pincode: pincode || 'Verified Serviceable',
        message: `Available in stock at Franchise Warehouse (${resellerDoc.business_name}). Delivery within 2-4 days.`,
      };
    }
  }

  // 3. Check Central / Company Warehouse Stock (Fallback or Direct EPC)
  const CompanyWarehouse = require('../../solarshop-india/models/india_core_db/company_warehouses.schema');

  // Find nearest active master or sub warehouse
  let companyWh = null;
  if (district_id && mongoose.Types.ObjectId.isValid(district_id)) {
    companyWh = await CompanyWarehouse.findOne({
      level_2: district_id,
      is_active: true,
      deleted_at: null,
    }).lean();
  }

  if (!companyWh) {
    companyWh = await CompanyWarehouse.findOne({
      is_active: true,
      deleted_at: null,
    }).sort({ warehouse_type: 1 }).lean();
  }

  const centralAvailableStock = 500; // Central stock buffer

  if (centralAvailableStock >= qty) {
    return {
      available: true,
      fulfillment_source: 'company_warehouse',
      warehouse_name: companyWh ? `${companyWh.name || 'Central Master Hub'}` : 'SolarKits Central Master Warehouse',
      warehouse_id: companyWh?._id || null,
      reseller_id: resellerDoc?._id || null,
      reseller_name: resellerDoc?.business_name || null,
      available_quantity: centralAvailableStock,
      requested_quantity: qty,
      estimated_delivery_days: '3-5 Business Days',
      pincode: pincode || 'Verified Serviceable',
      message: resellerDoc
        ? `Fulfilled via Central Company Warehouse (Allocated for Franchise Partner ${resellerDoc.business_name}).`
        : `Available in stock at SolarKits Central Warehouse. Delivery within 3-5 days.`,
    };
  }

  return {
    available: false,
    fulfillment_source: null,
    warehouse_name: null,
    available_quantity: Math.max(0, franchiseStock),
    requested_quantity: qty,
    estimated_delivery_days: null,
    pincode: pincode || null,
    message: `Out of Stock: Requested quantity (${qty} Kits) exceeds current warehouse capacity. Please reduce quantity or request custom bulk procurement.`,
  };
}

/**
 * 2. Create EPC Offline Bank Transfer Order
 */
async function createEpcOfflineOrder({
  epc_id,
  items = [],
  delivery_address = {},
  offline_payment_data = {},
  actor_id = null,
  req = null,
  fulfillment_mode = 'franchisee_warehouse',
  order_load_metrics = null,
}) {
  if (!items || items.length === 0) {
    throw new Error('Cart must contain at least one item');
  }

  const { utr_number, amount_paid, payment_date, receipt_url, receipt_filename, sender_bank_name, account_holder_name } = offline_payment_data;

  if (!utr_number || !utr_number.trim()) {
    throw new Error('UTR / Transaction Reference Number is mandatory for offline bank transfer checkout.');
  }

  const cleanUtr = utr_number.trim().toUpperCase();

  // Check if UTR is already submitted on an active/approved order
  const duplicateUtr = await EpcOrder.findOne({
    'offline_payment.utr_number': cleanUtr,
    payment_status: { $in: ['captured', 'pending_verification'] },
  }).lean();

  if (duplicateUtr) {
    throw new Error(`UTR "${cleanUtr}" is already submitted for Order #${duplicateUtr.order_number}.`);
  }

  // Lookup EPC account for address fallback & profiling
  const epc = (epc_id && mongoose.Types.ObjectId.isValid(epc_id))
    ? await EpcAccount.findById(epc_id).lean()
    : null;

  // 1. Route order to reseller (Primary Reseller > Territory Match > Direct Fallback)
  const route = await routeEpcOrderToReseller(epc_id, delivery_address);
  const targetResellerId = route.reseller_id;

  // 2. Server-side price calculation
  let totals = null;
  if (targetResellerId) {
    totals = await calculateCheckoutPrice(targetResellerId, items);
  } else {
    const settings = await SolarShopSettings.findOne().lean();
    const gstRate = settings?.gst_rate || 13.8;

    let subtotalPaise = 0;
    let taxTotalPaise = 0;
    const directItems = [];

    for (const item of items) {
      const qty = parseInt(item.quantity, 10) || parseInt(item.qty, 10) || 1;
      const ourPriceRupees = parseFloat(item.ourPrice || item.unit_price_inr || 180000);
      // ── CRITICAL: ourPrice from the shop API is GST-INCLUSIVE ──
      // standardPrice = base × (1 + margin%) × (1 + gst%) — already incl. GST
      // So: baseExclGst = ourPrice / (1 + gstRate/100)
      // grand_total = subtotal (base) + tax = ourPrice × qty  ✓
      const unitPriceInclGstPaise = Math.round(ourPriceRupees * 100); // what EPC pays per kit
      const unitBaseExclGstPaise  = Math.round(unitPriceInclGstPaise / (1 + gstRate / 100));
      const unitTaxPaise          = unitPriceInclGstPaise - unitBaseExclGstPaise;

      const itemBaseSubtotal = qty * unitBaseExclGstPaise;
      const itemTax          = qty * unitTaxPaise;

      subtotalPaise += itemBaseSubtotal;
      taxTotalPaise += itemTax;

      directItems.push({
        scope_type: item.scope_type || (item.kit_id ? 'kit' : 'product'),
        product_id: item.product_id || null,
        kit_id: item.kit_id || item.id || null,
        item_name: item.kitName || item.title || item.name || item.item_name || 'Solar Kit',
        image: item.image || item.kit_image || null,
        capacity: item.capacity || null,
        description: item.description || null,
        quantity: qty,
        unit_price_paise: unitBaseExclGstPaise,           // base excl. GST
        unit_price_incl_gst_paise: unitPriceInclGstPaise, // EPC-facing price per kit
        cost_price_paise: Math.round(unitBaseExclGstPaise * 0.85),
        reseller_margin_paise: 0,
        platform_commission_paise: 0,
        gst_rate: gstRate,
        tax_paise: itemTax,
        total_price_paise: itemBaseSubtotal + itemTax,    // = qty × ourPrice (incl. GST)
      });
    }

    totals = {
      items: directItems,
      subtotal_paise: subtotalPaise,
      tax_total_paise: taxTotalPaise,
      shipping_fee_paise: 0,
      grand_total_paise: subtotalPaise + taxTotalPaise,
      gst_rate: gstRate,
    };
  }

  // 3. Process items and margin calculation
  let totalResellerMarginPaise = 0;
  let totalPlatformCommissionPaise = 0;
  const processedItems = [];

  for (const item of totals.items) {
    const costPrice = item.cost_price_paise || Math.round(item.unit_price_paise * 0.85);
    const grossMargin = (item.unit_price_paise - costPrice) * item.quantity;
    const commission = targetResellerId ? Math.round(item.total_price_paise * ((item.platform_commission_pct || 5) / 100)) : 0;
    let netMargin = targetResellerId ? Math.max(0, grossMargin - commission) : 0;

    // Check if tiered variation commission is configured for this franchise & combo kit
    if (targetResellerId && item.kit_id) {
      const variationComm = await resolveVariationCommission({
        reseller_id: targetResellerId,
        combo_kit_id: item.kit_id,
        quantity: item.quantity,
        order_type: 'loose',
      });
      if (variationComm !== null && variationComm >= 0) {
        netMargin = variationComm;
      }
    }

    totalResellerMarginPaise += netMargin;
    totalPlatformCommissionPaise += commission;

    processedItems.push({
      scope_type: item.item_type || item.scope_type || 'kit',
      product_id: item.product_id || null,
      kit_id: item.kit_id || null,
      item_name: item.item_name || item.name || 'Solar Component',
      image: item.image || item.kit_image || null,
      capacity: item.capacity || null,
      description: item.description || null,
      quantity: item.quantity,
      unit_price_paise: item.unit_price_paise,
      cost_price_paise: costPrice,
      reseller_margin_paise: netMargin,
      platform_commission_paise: commission,
      gst_rate: totals.gst_rate || 13.8,
      tax_paise: item.tax_paise,
      total_price_paise: item.total_price_paise,
    });
  }

  const orderNumber = generateEpcOrderNumber();
  const fulfillmentSource = targetResellerId ? 'franchise_warehouse' : 'company_warehouse';

  // 4. Create EPC Order in 'pending_verification' status
  const epcOrder = await EpcOrder.create({
    order_number: orderNumber,
    epc_id,
    reseller_id: targetResellerId || null,
    routing_source: route.routing_source,
    fulfillment_source: fulfillmentSource,
    fulfillment_mode: fulfillment_mode || (targetResellerId ? 'franchisee_warehouse' : 'direct_site'),
    order_load_metrics: order_load_metrics || {
      total_kits: processedItems.reduce((acc, it) => acc + (it.quantity || 0), 0),
      total_kw: processedItems.reduce((acc, it) => acc + ((it.quantity || 0) * (it.kw || 5)), 0),
      total_weight_kg: processedItems.reduce((acc, it) => acc + ((it.quantity || 0) * 250), 0),
    },
    items: processedItems,
    subtotal_paise: totals.subtotal_paise,
    tax_total_paise: totals.tax_total_paise,
    shipping_fee_paise: totals.shipping_fee_paise || 0,
    grand_total_paise: totals.grand_total_paise,
    reseller_total_margin_paise: totalResellerMarginPaise,
    platform_total_commission_paise: totalPlatformCommissionPaise,
    order_status: 'pending',
    payment_method: 'offline_bank_transfer',
    payment_status: 'pending_verification',
    payment_reference: cleanUtr,
    offline_payment: {
      utr_number: cleanUtr,
      amount_paid: Number(amount_paid) || (totals.grand_total_paise / 100),
      payment_date: payment_date ? new Date(payment_date) : new Date(),
      receipt_url: receipt_url || null,
      receipt_filename: receipt_filename || null,
      sender_bank_name: sender_bank_name ? sender_bank_name.trim() : null,
      account_holder_name: account_holder_name ? account_holder_name.trim() : null,
      verification_status: 'pending',
      resubmitted_count: 0,
    },
    is_end_customer_sale: true,
    delivery_address: {
      line: delivery_address.line || delivery_address.address_line || delivery_address.address || epc?.address || 'Site delivery address registered with EPC profile',
      state_id: (delivery_address.state_id && mongoose.Types.ObjectId.isValid(delivery_address.state_id)) ? delivery_address.state_id : (epc?.states?.[0] || null),
      state_name: delivery_address.state_name || epc?.state_name || null,
      district_id: (delivery_address.district_id && mongoose.Types.ObjectId.isValid(delivery_address.district_id)) ? delivery_address.district_id : (epc?.districts?.[0] || null),
      district_name: delivery_address.district_name || epc?.district_name || null,
      pincode: delivery_address.pincode || epc?.pincode || null,
      contact_name: delivery_address.contact_name || epc?.name || 'Site Manager',
      contact_phone: delivery_address.contact_phone || delivery_address.contact_number || epc?.whatsapp || null,
    },
    reservation_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48-hr hold while under accounts review
  });

  // Double commit prevention: If franchisee warehouse, increment allocated_incoming_kits
  if (targetResellerId && fulfillment_mode === 'franchisee_warehouse') {
    const incomingKits = (order_load_metrics?.total_kits) || processedItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
    try {
      await Reseller.findByIdAndUpdate(targetResellerId, {
        $inc: { 'warehouse_capacity.allocated_incoming_kits': incomingKits }
      });
    } catch (capacityErr) {
      console.warn('[createEpcOfflineOrder] Could not increment allocated_incoming_kits on reseller:', capacityErr.message);
    }
  }

  // 5. Hold stock in inventory ledger if reseller assigned
  if (targetResellerId) {
    for (const item of processedItems) {
      const currentBalance = await calculateCurrentItemStock(targetResellerId, item.scope_type, item.product_id, item.kit_id);
      await ResellerInventoryLedger.create({
        reseller_id: targetResellerId,
        item_type: item.scope_type,
        product_id: item.product_id || null,
        kit_id: item.kit_id || null,
        movement_type: 'reservation_hold',
        quantity: -item.quantity,
        balance_after: currentBalance - item.quantity,
        unit_cost_paise: item.unit_price_paise,
        total_valuation_paise: item.total_price_paise,
        reference_type: 'epc_order',
        reference_id: epcOrder._id,
        reason: `Pending offline UTR verification for order ${orderNumber}`,
        actor_id: actor_id || epc_id,
      });
    }
  }

  await logAudit({
    actor_type: 'epc_buyer',
    actor_id: epc_id,
    action: 'EPC_OFFLINE_PAYMENT_SUBMITTED',
    entity_type: 'epc_orders',
    entity_id: epcOrder._id,
    after_snapshot: {
      order_number: orderNumber,
      grand_total_paise: totals.grand_total_paise,
      utr_number: cleanUtr,
      reseller_id: targetResellerId,
    },
    req,
  });

  return {
    order: epcOrder,
    reseller_id: targetResellerId,
    routing_source: route.routing_source,
    fulfillment_source: fulfillmentSource,
  };
}

/**
 * 3. Re-submit Payment Proof after Accounts Rejection
 */
async function resubmitEpcPaymentProof({
  order_id,
  epc_id,
  utr_number,
  amount_paid,
  payment_date,
  receipt_url,
  receipt_filename,
  sender_bank_name,
  req = null,
}) {
  const order = await EpcOrder.findOne({ _id: order_id, epc_id });
  if (!order) {
    throw new Error('Order record not found or unauthorized access.');
  }

  if (order.payment_status !== 'rejected') {
    throw new Error(`Only rejected payment orders can be re-submitted. Current payment status: ${order.payment_status}`);
  }

  const cleanUtr = utr_number ? utr_number.trim().toUpperCase() : order.offline_payment?.utr_number;
  if (!cleanUtr) {
    throw new Error('A valid UTR Number is required for payment re-submission.');
  }

  order.payment_status = 'pending_verification';
  order.order_status = 'pending';
  order.payment_reference = cleanUtr;

  order.offline_payment = {
    ...order.offline_payment,
    utr_number: cleanUtr,
    amount_paid: Number(amount_paid) || order.offline_payment?.amount_paid || (order.grand_total_paise / 100),
    payment_date: payment_date ? new Date(payment_date) : (order.offline_payment?.payment_date || new Date()),
    receipt_url: receipt_url || order.offline_payment?.receipt_url,
    receipt_filename: receipt_filename || order.offline_payment?.receipt_filename,
    sender_bank_name: sender_bank_name || order.offline_payment?.sender_bank_name,
    verification_status: 'pending',
    rejection_reason: null,
    resubmitted_count: (order.offline_payment?.resubmitted_count || 0) + 1,
  };

  await order.save();

  await logAudit({
    actor_type: 'epc_buyer',
    actor_id: epc_id,
    action: 'EPC_PAYMENT_PROOF_RESUBMITTED',
    entity_type: 'epc_orders',
    entity_id: order._id,
    after_snapshot: {
      order_number: order.order_number,
      utr_number: cleanUtr,
      resubmitted_count: order.offline_payment.resubmitted_count,
    },
    req,
  });

  return order;
}

/**
 * 4. Accounts Department Verification: Approve or Reject
 */
async function reviewEpcOfflinePayment({
  order_id,
  admin_user_id,
  decision, // 'approved' | 'rejected'
  rejection_reason = '',
  notes = '',
  req = null,
}) {
  if (!['approved', 'rejected'].includes(decision)) {
    throw new Error('Decision must be "approved" or "rejected".');
  }

  const order = await EpcOrder.findById(order_id);
  if (!order) {
    throw new Error(`EPC Order "${order_id}" not found.`);
  }

  if (decision === 'approved') {
    order.payment_status = 'captured';
    order.order_status = 'confirmed';

    // Generate Official Tax Invoice Number
    const invoiceNum = generateInvoiceNumber(order._id);
    order.invoice = {
      invoice_number: invoiceNum,
      invoice_date: new Date(),
      invoice_url: `/api/india/v1/shop/orders/${order._id}/invoice-pdf`,
      generated_at: new Date(),
    };

    order.offline_payment.verification_status = 'approved';
    order.offline_payment.verified_by = admin_user_id;
    order.offline_payment.verified_at = new Date();
    order.offline_payment.notes = notes || 'Payment verified by Accounts';

    await order.save();

    // Deduct stock permanently (sales_out) in ResellerInventoryLedger
    if (order.reseller_id) {
      for (const item of order.items) {
        const currentBalance = await calculateCurrentItemStock(order.reseller_id, item.scope_type, item.product_id, item.kit_id);
        await ResellerInventoryLedger.create({
          reseller_id: order.reseller_id,
          item_type: item.scope_type,
          product_id: item.product_id || null,
          kit_id: item.kit_id || null,
          movement_type: 'sales_out',
          quantity: -item.quantity,
          balance_after: currentBalance,
          unit_cost_paise: item.unit_price_paise,
          total_valuation_paise: item.total_price_paise,
          reference_type: 'epc_order',
          reference_id: order._id,
          reason: `Offline Payment Approved: Deducted for Order #${order.order_number}`,
          actor_id: admin_user_id,
        });
      }
    }

    // Settle Franchise Margin / Commission to Wallet
    try {
      if (order.reseller_id && order.reseller_total_margin_paise > 0) {
        await creditResellerMargin({
          resellerId: order.reseller_id,
          orderId: order._id,
          orderNumber: order.order_number,
          marginPaise: order.reseller_total_margin_paise,
        });
      }

      if (order.epc_id && order.is_end_customer_sale && order.platform_total_commission_paise > 0) {
        await creditEpcMargin({
          epcAccountId: order.epc_id,
          orderId: order._id,
          orderNumber: order.order_number,
          marginPaise: order.platform_total_commission_paise,
        });
      }
    } catch (wErr) {
      console.error('[epc.offline.checkout] Commission settlement error:', wErr.message);
    }

    await logAudit({
      actor_type: 'cms_user',
      actor_id: admin_user_id,
      action: 'EPC_PAYMENT_ACCOUNTS_APPROVED',
      entity_type: 'epc_orders',
      entity_id: order._id,
      after_snapshot: {
        order_number: order.order_number,
        invoice_number: invoiceNum,
        payment_status: 'captured',
      },
      req,
    });

  } else if (decision === 'rejected') {
    if (!rejection_reason || !rejection_reason.trim()) {
      throw new Error('Please provide a specific rejection comment/reason for the EPC buyer.');
    }

    order.payment_status = 'rejected';
    order.offline_payment.verification_status = 'rejected';
    order.offline_payment.verified_by = admin_user_id;
    order.offline_payment.verified_at = new Date();
    order.offline_payment.rejection_reason = rejection_reason.trim();
    order.offline_payment.notes = notes || 'Payment rejected by Accounts department';

    await order.save();

    await logAudit({
      actor_type: 'cms_user',
      actor_id: admin_user_id,
      action: 'EPC_PAYMENT_ACCOUNTS_REJECTED',
      entity_type: 'epc_orders',
      entity_id: order._id,
      after_snapshot: {
        order_number: order.order_number,
        rejection_reason: rejection_reason.trim(),
        payment_status: 'rejected',
      },
      req,
    });
  }

  return order;
}

/**
 * 5. Operations & Warehouse Dispatch & Tracking Entry
 */
async function updateEpcOrderDispatch({
  order_id,
  admin_user_id,
  courier_name,
  tracking_number,
  tracking_url = null,
  estimated_delivery = null,
  dispatch_notes = null,
  req = null,
}) {
  const order = await EpcOrder.findById(order_id);
  if (!order) {
    throw new Error(`Order "${order_id}" not found.`);
  }

  if (order.payment_status !== 'captured') {
    throw new Error(`Cannot dispatch order. Payment must be approved first (current status: ${order.payment_status}).`);
  }

  order.order_status = 'dispatched';
  order.dispatch_tracking = {
    courier_name: courier_name ? courier_name.trim() : 'SolarKits Express Logistics',
    tracking_number: tracking_number ? tracking_number.trim() : `LR-${Date.now()}`,
    tracking_url: tracking_url ? tracking_url.trim() : `https://track.solarkits.com/?lr=${tracking_number}`,
    dispatched_at: new Date(),
    estimated_delivery: estimated_delivery ? new Date(estimated_delivery) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    dispatched_by: admin_user_id,
    dispatch_notes: dispatch_notes || 'Dispatched via authorized logistics transport',
  };

  await order.save();

  await logAudit({
    actor_type: 'cms_user',
    actor_id: admin_user_id,
    action: 'EPC_ORDER_DISPATCHED',
    entity_type: 'epc_orders',
    entity_id: order._id,
    after_snapshot: {
      order_number: order.order_number,
      courier_name: order.dispatch_tracking.courier_name,
      tracking_number: order.dispatch_tracking.tracking_number,
    },
    req,
  });

  return order;
}

/**
 * 6. Complete / Deliver EPC Order
 */
async function markEpcOrderDelivered(order_id, admin_user_id, req = null) {
  const order = await EpcOrder.findById(order_id);
  if (!order) throw new Error(`Order "${order_id}" not found.`);

  order.order_status = 'delivered';
  order.delivered_at = new Date();
  await order.save();

  await logAudit({
    actor_type: 'cms_user',
    actor_id: admin_user_id,
    action: 'EPC_ORDER_DELIVERED',
    entity_type: 'epc_orders',
    entity_id: order._id,
    after_snapshot: { order_number: order.order_number, status: 'delivered' },
    req,
  });

  return order;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1.1: CHECKOUT WAREHOUSE CAPACITY CHECK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * checkWarehouseCapacityForMode
 *
 * Validates whether the selected fulfillment warehouse can absorb the incoming
 * order (by kit count) without exceeding its physical capacity limits.
 *
 * Uses the formula:
 *   Available Capacity = max_kits - (current_stock_kits + allocated_incoming_kits)
 *
 * NOTE: This is a READ-ONLY check. The actual slot commitment (incrementing
 * allocated_incoming_kits) is performed atomically during order creation in
 * createEpcOfflineOrder() — preventing double commits under concurrent checkouts.
 *
 * @param {Object} params
 * @param {string}  params.fulfillment_mode    'franchisee_warehouse' | 'epc_warehouse'
 * @param {Object}  params.order_load_metrics  { total_kits, total_kw, total_weight_kg }
 * @param {string}  [params.franchisee_id]     Reseller _id (required for franchisee_warehouse)
 * @param {string}  [params.warehouse_id]      CompanyWarehouse _id (required for epc_warehouse)
 * @returns {Object} { allowed, available_capacity, max_capacity, current_load, message }
 */
async function checkWarehouseCapacityForMode({ fulfillment_mode, order_load_metrics, franchisee_id, warehouse_id }) {
  const orderKits = Number(order_load_metrics?.total_kits || 0);

  if (fulfillment_mode === 'franchisee_warehouse') {
    if (!franchisee_id) throw new Error('franchisee_id is required for Franchisee Warehouse capacity check.');

    const reseller = await Reseller.findById(franchisee_id)
      .select('warehouse_capacity business_name')
      .lean();

    if (!reseller) throw new Error('Franchisee not found.');

    const cap = reseller.warehouse_capacity || {};
    const maxKits         = cap.max_kits || 0;
    const currentStock    = cap.current_stock_kits || 0;
    const allocatedIncoming = cap.allocated_incoming_kits || 0;
    const currentLoad     = currentStock + allocatedIncoming;
    const availableSlots  = Math.max(0, maxKits - currentLoad);
    const allowed         = maxKits === 0 || availableSlots >= orderKits;

    return {
      allowed,
      available_capacity: availableSlots,
      max_capacity:       maxKits,
      current_load:       currentLoad,
      warehousing_entity: reseller.business_name || 'Franchisee Warehouse',
      message: allowed
        ? `Sufficient capacity. ${availableSlots} kit slots available.`
        : `Insufficient capacity. Only ${availableSlots} slots available; your order requires ${orderKits} kits.`,
    };
  }

  if (fulfillment_mode === 'epc_warehouse') {
    const { CompanyWarehouse } = require('../models/company_warehouse_db');
    const query = warehouse_id
      ? { _id: warehouse_id, is_active: true }
      : { is_active: true, warehouse_type: 'master' };

    const warehouse = await CompanyWarehouse.findOne(query)
      .select('warehouse_code max_kit_capacity allocated_incoming_capacity')
      .lean();

    if (!warehouse) throw new Error('EPC Warehouse not found.');

    const maxKits           = warehouse.max_kit_capacity || 0;
    const allocated         = warehouse.allocated_incoming_capacity || 0;
    const availableSlots    = Math.max(0, maxKits - allocated);
    const allowed           = maxKits === 0 || availableSlots >= orderKits;

    return {
      allowed,
      available_capacity: availableSlots,
      max_capacity:       maxKits,
      current_load:       allocated,
      warehousing_entity: warehouse.warehouse_code || 'EPC Warehouse',
      message: allowed
        ? `Sufficient capacity. ${availableSlots} kit slots available.`
        : `Insufficient capacity. Only ${availableSlots} slots available; your order requires ${orderKits} kits.`,
    };
  }

  // direct_site — no capacity check needed
  return { allowed: true, message: 'No warehouse capacity check required for direct site delivery.' };
}


// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1.2: VEHICLE ASSIGNMENT — STAGE 3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * assignVehicleToOrder
 *
 * Transitions an EPC order to Stage 3 (vehicle_assigned).
 * Accepts a vehicle (recommended or admin-override) and snapshots vehicle +
 * driver info into the order document.
 *
 * @param {Object} params
 * @param {string} params.order_id
 * @param {Object} params.vehicle         Full vehicle doc or populated object
 * @param {Object} [params.driver]        { driver_id, driver_name, driver_contact }
 * @param {boolean} params.is_recommended  Was this vehicle auto-recommended?
 * @param {string} [params.override_reason] Required when is_recommended = false
 * @param {string} params.admin_user_id
 * @param {Object} params.req             Express request (for audit trail)
 */
async function assignVehicleToOrder({ order_id, vehicle, driver, is_recommended, override_reason, admin_user_id, req }) {
  const order = await EpcOrder.findById(order_id);
  if (!order) throw new Error('Order not found.');

  const allowedFromStatus = ['confirmed', 'processing', 'vehicle_assigned'];
  if (!allowedFromStatus.includes(order.order_status)) {
    throw new Error(`Cannot assign vehicle from current status: ${order.order_status}.`);
  }

  order.order_status = 'vehicle_assigned';
  order.assigned_vehicle = {
    vehicle_id:          vehicle._id || vehicle.id,
    vehicle_name:        vehicle.name,
    vehicle_type:        vehicle.vehicle_type || null,
    registration_number: vehicle.registration_number,
    driver_id:           driver?.driver_id    || null,
    driver_name:         driver?.driver_name  || null,
    driver_contact:      driver?.driver_contact || null,
    is_recommended:      is_recommended !== false,
    override_reason:     is_recommended === false ? (override_reason || null) : null,
    overridden_by:       is_recommended === false ? admin_user_id : null,
    overridden_at:       is_recommended === false ? new Date() : null,
    assigned_by:         admin_user_id,
    assigned_at:         new Date(),
  };

  await order.save();

  await logAudit({
    actor_type: 'cms_user',
    actor_id:   admin_user_id,
    action:     'EPC_VEHICLE_ASSIGNED',
    entity_type:'epc_orders',
    entity_id:  order._id,
    after_snapshot: {
      order_number: order.order_number,
      status:       'vehicle_assigned',
      vehicle:      vehicle.name,
      registration: vehicle.registration_number,
      is_recommended,
    },
    req,
  });

  return order;
}


// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1.3: GENERIC 8-STAGE ORDER STATUS TRANSITION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * updateOrderStage
 *
 * Generic state machine transition for EPC orders across Stages 2-8.
 * Allowed transitions enforced by STAGE_FLOW.
 *
 * Stages:
 *   2. confirmed       → processing
 *   3. processing      → vehicle_assigned      (handled by assignVehicleToOrder)
 *   4. vehicle_assigned→ ready_for_dispatch
 *   5. ready_for_dispatch → dispatched
 *   6. dispatched      → in_transit
 *   6b.in_transit      → milestone append
 *   7. in_transit      → reached_destination
 *   8. reached_destination → delivered
 *
 * @param {Object} params
 * @param {string}  params.order_id
 * @param {string}  params.new_status       Target status
 * @param {string}  params.admin_user_id
 * @param {Object}  [params.dispatch_data]  For 'dispatched': { courier_name, tracking_number, tracking_url, estimated_delivery, dispatch_notes }
 * @param {Object}  [params.milestone]      For 'in_transit': { status, description }
 * @param {Object}  params.req
 */
async function updateOrderStage({ order_id, new_status, admin_user_id, dispatch_data, milestone, req }) {
  const STAGE_FLOW = {
    processing:           ['confirmed'],
    ready_for_dispatch:   ['vehicle_assigned'],
    dispatched:           ['ready_for_dispatch'],
    in_transit:           ['dispatched', 'in_transit'],
    reached_destination:  ['in_transit'],
    delivered:            ['reached_destination'],
  };

  const order = await EpcOrder.findById(order_id);
  if (!order) throw new Error('Order not found.');

  const allowedFrom = STAGE_FLOW[new_status];
  if (!allowedFrom) throw new Error(`Invalid target status: ${new_status}.`);
  if (!allowedFrom.includes(order.order_status)) {
    throw new Error(
      `Cannot move to '${new_status}' from current status '${order.order_status}'. ` +
      `Allowed from: ${allowedFrom.join(', ')}.`
    );
  }

  // ── Status-specific logic ─────────────────────────────────────────────────
  if (new_status === 'dispatched' && dispatch_data) {
    order.dispatch_tracking = {
      ...order.dispatch_tracking?.toObject?.() || {},
      courier_name:       dispatch_data.courier_name    || null,
      tracking_number:    dispatch_data.tracking_number || null,
      tracking_url:       dispatch_data.tracking_url    || null,
      dispatched_at:      new Date(),
      estimated_delivery: dispatch_data.estimated_delivery || null,
      dispatched_by:      admin_user_id,
      dispatch_notes:     dispatch_data.dispatch_notes  || null,
    };
  }

  if (new_status === 'in_transit' && milestone) {
    order.milestones = order.milestones || [];
    order.milestones.push({
      status:      milestone.status,
      description: milestone.description || null,
      recorded_by: admin_user_id,
      recorded_at: new Date(),
    });
  }

  if (new_status === 'delivered') {
    order.delivered_at = new Date();
  }

  order.order_status = new_status;
  await order.save();

  await logAudit({
    actor_type: 'cms_user',
    actor_id:   admin_user_id,
    action:     `EPC_ORDER_${new_status.toUpperCase()}`,
    entity_type:'epc_orders',
    entity_id:  order._id,
    after_snapshot: { order_number: order.order_number, status: new_status },
    req,
  });

  return order;
}


module.exports = {
  COMPANY_BANK_DETAILS,
  checkWarehouseStockAvailability,
  checkWarehouseCapacityForMode,
  createEpcOfflineOrder,
  resubmitEpcPaymentProof,
  reviewEpcOfflinePayment,
  updateEpcOrderDispatch,
  markEpcOrderDelivered,
  generateInvoiceNumber,
  assignVehicleToOrder,
  updateOrderStage,
};
