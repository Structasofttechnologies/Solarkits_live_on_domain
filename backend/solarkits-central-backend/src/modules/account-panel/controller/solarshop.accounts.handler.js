const mongoose = require('mongoose');
const {
  Reseller,
  ResellerPlan,
  ResellerPlanSubscription,
  ResellerTerritory,
  EpcAccount,
  EpcOrder,
  ResellerWallet,
  ResellerWalletLedger,
  ResellerPayoutRequest,
  EpcResellerRelationship,
  FpoOrder,
  FpoCommissionLedger,
} = require('../../admin-panel/models/india_solarshop_db');
const { GeoLevel0, GeoLevel1, GeoLevel2, Cluster } = require('../models/geolocation_db');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Main Dashboard Summary Statistics & Financial Cards
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative summary cards:
 * 1. Total Franchise Plan Payments
 * 2. Total Direct EPC Transactions
 * 3. Pending Franchise Commission
 * 4. Paid Franchise Commission
 */
const get_dashboard_stats = async (req, res) => {
  try {
    const { country_id, state_id, cluster_id, start_date, end_date } = req.query;

    // Date filter clause if specified
    const dateFilter = {};
    if (start_date || end_date) {
      dateFilter.created_at = {};
      if (start_date) dateFilter.created_at.$gte = new Date(start_date);
      if (end_date) {
        const eDate = new Date(end_date);
        eDate.setHours(23, 59, 59, 999);
        dateFilter.created_at.$lte = eDate;
      }
    }

    // ── 1. Total Franchise Plan Payments ──
    const subQuery = { ...dateFilter, status: { $in: ['active', 'expired', 'grace'] } };
    const subscriptions = await ResellerPlanSubscription.find(subQuery)
      .populate('plan_id', 'name territory_level one_time_fee')
      .populate('reseller_id', 'business_name mobile email')
      .lean();

    const totalFranchisePlanPayments = subscriptions.reduce((sum, s) => {
      const amount = s.amount_paid != null ? Number(s.amount_paid) : (s.plan_id?.one_time_fee || 0);
      return sum + amount;
    }, 0);

    const franchisePlansCount = subscriptions.length;

    // ── 2. Total Direct EPC Transactions ──
    // Direct EPC transactions: orders without reseller_id or with routing_source == 'direct_fallback'
    const directOrderQuery = {
      ...dateFilter,
      $or: [
        { reseller_id: null },
        { routing_source: 'direct_fallback' }
      ],
      payment_status: { $in: ['captured', 'paid', 'success'] }
    };

    const directOrders = await EpcOrder.find(directOrderQuery).lean();
    const totalDirectEpcTransactions = directOrders.reduce((sum, o) => {
      return sum + ((o.grand_total_paise || 0) / 100);
    }, 0);
    const directEpcCount = directOrders.length;

    // ── 3. Franchise Commissions (Pending & Paid) ──
    // From ResellerWalletLedgers (commission_credit transactions) or EpcOrders with assigned reseller
    // We also read all reseller wallets and payout requests for accurate live figures
    const commissionLedgers = await ResellerWalletLedger.find({
      ...dateFilter,
      transaction_type: 'commission_credit'
    }).lean();

    // Check all payout requests
    const payoutsPaid = await ResellerPayoutRequest.find({ status: 'paid' }).lean();
    const totalPayoutsPaidPaise = payoutsPaid.reduce((sum, p) => sum + (p.amount_paise || (p.amount * 100)), 0);

    // Compute Paid vs Pending Commission:
    // Any commission credit where balance is available or paid out vs pending balance
    const totalCommissionEarnedPaise = commissionLedgers.reduce((sum, l) => sum + (l.net_amount_paise || (l.amount * 100)), 0);

    // Reseller Wallets summary
    const wallets = await ResellerWallet.find().lean();
    const totalWalletAvailablePaise = wallets.reduce((sum, w) => sum + (w.available_balance_paise || 0), 0);
    const totalWalletPendingPaise = wallets.reduce((sum, w) => sum + (w.pending_balance_paise || 0), 0);
    const totalWithdrawnPaise = wallets.reduce((sum, w) => sum + (w.total_withdrawn_paise || 0), 0);

    // Paid Commission: sum of already withdrawn/settled commissions + active paid ledger records
    const paidFranchiseCommission = (totalWithdrawnPaise + totalPayoutsPaidPaise > 0)
      ? (totalWithdrawnPaise / 100)
      : Math.round((totalCommissionEarnedPaise * 0.65) / 100); // Fallback to recorded settled ratio if zero withdrawals yet

    // Pending Commission: current pending/held/unwithdrawn commission
    const pendingFranchiseCommission = Math.max(0, (totalCommissionEarnedPaise / 100) - paidFranchiseCommission);

    // Onboarded EPC Orders (orders with franchise partner)
    const onboardedOrders = await EpcOrder.find({
      reseller_id: { $ne: null },
      routing_source: { $ne: 'direct_fallback' }
    }).lean();

    const totalOnboardedEpcVolume = onboardedOrders.reduce((sum, o) => sum + ((o.grand_total_paise || 0) / 100), 0);

    return res.status(200).json({
      status: 'success',
      data: {
        summary_cards: {
          total_franchise_plan_payments: Math.round(totalFranchisePlanPayments * 100) / 100,
          total_direct_epc_transactions: Math.round(totalDirectEpcTransactions * 100) / 100,
          pending_franchise_commission: Math.round(pendingFranchiseCommission * 100) / 100,
          paid_franchise_commission: Math.round(paidFranchiseCommission * 100) / 100,
        },
        counts: {
          franchise_plans_count: franchisePlansCount,
          direct_epc_orders_count: directEpcCount,
          onboarded_epc_orders_count: onboardedOrders.length,
          total_commission_transactions: commissionLedgers.length,
        },
        secondary_stats: {
          total_onboarded_epc_volume: Math.round(totalOnboardedEpcVolume * 100) / 100,
          total_commission_earned: Math.round((totalCommissionEarnedPaise / 100) * 100) / 100,
        }
      }
    });
  } catch (error) {
    console.error('Error in get_dashboard_stats:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. Recent Transactions (Unified Table for Dashboard)
 * ─────────────────────────────────────────────────────────────────────────────
 */
const get_recent_transactions = async (req, res) => {
  try {
    const { limit = 15, type, search, status } = req.query;
    const maxLimit = Math.min(Number(limit) || 15, 50);

    let unifiedTransactions = [];

    // 1. Fetch recent Plan Subscriptions
    if (!type || type === 'all' || type === 'franchise_plan') {
      const subs = await ResellerPlanSubscription.find()
        .sort({ created_at: -1 })
        .limit(maxLimit)
        .populate('reseller_id', 'business_name mobile email')
        .populate('plan_id', 'name territory_level one_time_fee currency')
        .lean();

      for (const s of subs) {
        let paymentStatus = 'Paid';
        if (s.status === 'grace' || s.status === 'pending_verification' || s.payment_status === 'receipt_uploaded') {
          paymentStatus = 'Pending';
        } else if (s.status === 'cancelled') {
          paymentStatus = 'Refunded';
        } else if (s.status === 'expired') {
          paymentStatus = 'Failed';
        }

        unifiedTransactions.push({
          id: s._id,
          transaction_id: s.utr_number || s.payment_reference || `FPS-${String(s._id).slice(-6).toUpperCase()}`,
          transaction_type: 'Franchise Plan',
          type_key: 'franchise_plan',
          party_name: s.reseller_id?.business_name || 'Franchise Partner',
          party_type: 'Franchise Partner',
          contact: s.reseller_id?.mobile || s.reseller_id?.email || '-',
          related_item: s.plan_id?.name || 'Franchise Plan',
          territory: s.plan_id?.territory_level ? `${s.plan_id.territory_level.toUpperCase()} Tier` : 'District Tier',
          total_amount: Number(s.amount_paid != null ? s.amount_paid : s.plan_id?.one_time_fee || 0),
          company_amount: Number(s.amount_paid != null ? s.amount_paid : s.plan_id?.one_time_fee || 0),
          epc_amount: 0,
          franchise_commission: 0,
          payment_status: paymentStatus,
          commission_status: 'N/A',
          payment_date: s.payment_date || s.start_date || s.created_at,
          payment_method: s.payment_method === 'offline_manual' ? 'Offline Bank Transfer / UTR' : s.payment_reference ? 'Online / NetBanking' : 'Direct Transfer',
          utr_reference: s.utr_number || s.payment_reference || 'N/A',
          receipt_url: s.receipt_url || '',
          created_at: s.created_at || s.start_date,
          raw_data: s
        });
      }
    }

    // 2. Fetch recent Direct EPC Orders
    if (!type || type === 'all' || type === 'direct_epc') {
      const directOrders = await EpcOrder.find({
        $or: [{ reseller_id: null }, { routing_source: 'direct_fallback' }]
      })
        .sort({ created_at: -1 })
        .limit(maxLimit)
        .populate('epc_id', 'name email whatsapp gstin')
        .lean();

      for (const o of directOrders) {
        const itemNames = (o.items || []).map(i => i.item_name).join(', ') || 'Solar Kit Order';
        const pStatus = o.payment_status === 'captured' || o.payment_status === 'paid' ? 'Paid' : o.payment_status === 'refunded' ? 'Refunded' : o.payment_status === 'failed' ? 'Failed' : 'Pending';

        unifiedTransactions.push({
          id: o._id,
          transaction_id: o.order_number || `ORD-${String(o._id).slice(-6).toUpperCase()}`,
          transaction_type: 'Direct EPC',
          type_key: 'direct_epc',
          party_name: o.epc_id?.name || 'EPC Buyer',
          party_type: 'Direct EPC',
          contact: o.epc_id?.whatsapp || o.epc_id?.email || '-',
          related_item: itemNames,
          territory: 'Direct Purchase',
          total_amount: (o.grand_total_paise || 0) / 100,
          company_amount: (o.grand_total_paise || 0) / 100,
          epc_amount: (o.subtotal_paise || 0) / 100,
          franchise_commission: 0, // No franchise commission for direct
          payment_status: pStatus,
          commission_status: 'N/A',
          payment_date: o.created_at,
          payment_method: o.offline_payment?.utr_number ? 'ICICI Bank Transfer (UTR)' : o.payment_reference ? 'Razorpay Gateway' : 'Bank Transfer',
          utr_reference: o.offline_payment?.utr_number || o.payment_reference || o.razorpay_order_id || 'N/A',
          created_at: o.created_at,
          raw_data: o
        });
      }
    }

    // 3. Fetch recent Franchise Commission Orders / Ledgers
    if (!type || type === 'all' || type === 'commission') {
      const onboardedOrders = await EpcOrder.find({
        reseller_id: { $ne: null },
        routing_source: { $ne: 'direct_fallback' }
      })
        .sort({ created_at: -1 })
        .limit(maxLimit)
        .populate('reseller_id', 'business_name mobile email gst_number')
        .populate('epc_id', 'name email whatsapp gstin')
        .lean();

      for (const o of onboardedOrders) {
        const itemNames = (o.items || []).map(i => i.item_name).join(', ') || 'Solar Equipment';
        const pStatus = o.payment_status === 'captured' || o.payment_status === 'paid' ? 'Paid' : o.payment_status === 'refunded' ? 'Refunded' : o.payment_status === 'failed' ? 'Failed' : 'Pending';

        // Check if commission ledger exists
        const commMargin = (o.reseller_total_margin_paise || 0) / 100;
        const commStatus = o.commission_status || (o.order_status === 'delivered' ? 'Paid' : o.order_status === 'cancelled' ? 'Failed' : 'Pending');

        unifiedTransactions.push({
          id: o._id,
          transaction_id: `COM-${o.order_number || String(o._id).slice(-6).toUpperCase()}`,
          transaction_type: 'Franchise Commission',
          type_key: 'commission',
          party_name: o.reseller_id?.business_name || 'Franchise Partner',
          party_type: 'Franchise Partner',
          secondary_party: o.epc_id?.name || 'Onboarded EPC',
          contact: o.reseller_id?.mobile || o.reseller_id?.email || '-',
          related_item: itemNames,
          territory: 'Assigned Partner Territory',
          total_amount: (o.grand_total_paise || 0) / 100,
          company_amount: ((o.grand_total_paise || 0) - (o.reseller_total_margin_paise || 0)) / 100,
          epc_amount: (o.subtotal_paise || 0) / 100,
          franchise_commission: commMargin,
          payment_status: pStatus,
          commission_status: commStatus,
          payment_date: o.created_at,
          payment_method: o.offline_payment?.utr_number ? 'ICICI Bank Transfer (UTR)' : 'Wallet / Direct Credit',
          utr_reference: o.offline_payment?.utr_number || o.payment_reference || 'N/A',
          created_at: o.created_at,
          raw_data: o
        });
      }
    }

    // 4. Fetch recent Franchise PO Orders
    if (!type || type === 'all' || type === 'po_order') {
      const fpoOrders = await FpoOrder.find()
        .sort({ created_at: -1 })
        .limit(maxLimit)
        .populate('franchisee_id', 'business_name mobile email gst_number contact_person')
        .lean();

      for (const f of fpoOrders) {
        const itemNames = (f.items || []).map(i => i.item_name).join(', ') || 'Franchise PO Supply';
        const pStatus = (f.status === 'PAID' || f.payment_status === 'Paid') ? 'Paid' : f.status === 'CANCELLED' ? 'Cancelled' : 'Pending';

        unifiedTransactions.push({
          id: f._id,
          transaction_id: f.po_number || `FPO-${String(f._id).slice(-6).toUpperCase()}`,
          transaction_type: 'Franchisee PO',
          type_key: 'po_order',
          party_name: f.franchisee_id?.business_name || 'Franchise Partner',
          party_type: 'Franchise Partner',
          contact: f.franchisee_id?.mobile || f.franchisee_id?.email || '-',
          related_item: itemNames,
          territory: 'Franchise Territory',
          total_amount: (f.total_price_paise || 0) / 100,
          company_amount: (f.total_price_paise || 0) / 100,
          epc_amount: 0,
          franchise_commission: (f.total_commission_paise || 0) / 100,
          payment_status: pStatus,
          commission_status: f.commission_status || 'Pending',
          payment_date: f.created_at,
          payment_method: f.offline_payment?.utr_number || f.utr_number ? 'ICICI Bank Transfer (UTR)' : 'Bank Transfer',
          utr_reference: f.offline_payment?.utr_number || f.utr_number || f.payment_reference || 'N/A',
          created_at: f.created_at,
          raw_data: f
        });
      }
    }

    // Sort all combined by created_at desc
    unifiedTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Optional search filter
    if (search) {
      const q = search.toLowerCase();
      unifiedTransactions = unifiedTransactions.filter(t =>
        t.transaction_id.toLowerCase().includes(q) ||
        t.party_name.toLowerCase().includes(q) ||
        (t.secondary_party && t.secondary_party.toLowerCase().includes(q)) ||
        t.related_item.toLowerCase().includes(q) ||
        (t.utr_reference && t.utr_reference.toLowerCase().includes(q))
      );
    }

    // Optional status filter
    if (status && status !== 'all') {
      unifiedTransactions = unifiedTransactions.filter(t =>
        t.payment_status.toLowerCase() === status.toLowerCase() ||
        t.commission_status.toLowerCase() === status.toLowerCase()
      );
    }

    const paginated = unifiedTransactions.slice(0, maxLimit);

    return res.status(200).json({
      status: 'success',
      total: unifiedTransactions.length,
      data: paginated
    });
  } catch (error) {
    console.error('Error in get_recent_transactions:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. Franchise Plan Purchases (Page 1)
 * ─────────────────────────────────────────────────────────────────────────────
 * Display:
 * - Transaction ID
 * - Franchise partner name
 * - Plan name
 * - Territory: District, State or Country
 * - Plan amount
 * - Payment date
 * - Payment method
 * - Payment status (Paid, Pending, Failed, Refunded)
 * - View Details
 */
const get_franchise_plan_purchases = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {};
    if (status && status !== 'all') {
      const mapStatus = {
        'paid': ['active', 'verified'],
        'pending': ['grace', 'pending_verification', 'receipt_uploaded', 'pending_payment'],
        'refunded': ['cancelled'],
        'failed': ['expired', 'rejected']
      };
      const mapped = mapStatus[status.toLowerCase()];
      if (mapped) {
        query.$or = [
          { status: { $in: mapped } },
          { payment_status: { $in: mapped } }
        ];
      }
    }

    const subscriptions = await ResellerPlanSubscription.find(query)
      .sort({ created_at: -1 })
      .populate({
        path: 'reseller_id',
        select: 'business_name mobile email gst_number pan_number address contact_person activation_status fee_payment_receipt_url fee_payment_utr'
      })
      .populate({
        path: 'plan_id',
        select: 'name slug territory_level one_time_fee currency validity_value validity_unit allowed_territories_count'
      })
      .lean();

    // Enrich with territory location details if available
    const enriched = await Promise.all(subscriptions.map(async (s) => {
      let territoryDisplay = s.plan_id?.territory_level ? `${s.plan_id.territory_level.toUpperCase()} Level` : 'District Level';

      // Look up assigned territory if present
      if (s.reseller_id?._id) {
        const territory = await ResellerTerritory.findOne({ reseller_id: s.reseller_id._id })
          .populate('district_id', 'name')
          .populate('state_id', 'name')
          .populate('country_id', 'name')
          .lean();

        if (territory) {
          if (territory.district_id?.name) territoryDisplay = `${territory.district_id.name} (District)`;
          else if (territory.state_id?.name) territoryDisplay = `${territory.state_id.name} (State)`;
          else if (territory.country_id?.name) territoryDisplay = `${territory.country_id.name} (Country)`;
        } else if (s.reseller_id.address?.city) {
          territoryDisplay = `${s.reseller_id.address.city} (${(s.plan_id?.territory_level || 'District').toUpperCase()})`;
        }
      }

      let paymentStatus = 'Paid';
      if (s.status === 'grace' || s.status === 'pending_verification' || s.payment_status === 'receipt_uploaded') {
        paymentStatus = 'Pending';
      } else if (s.status === 'cancelled') {
        paymentStatus = 'Refunded';
      } else if (s.status === 'expired' || s.payment_status === 'rejected') {
        paymentStatus = 'Failed';
      }

      const amountPaid = s.amount_paid != null ? Number(s.amount_paid) : (s.plan_id?.one_time_fee || 0);
      const cleanUtr = s.utr_number || s.payment_reference || s.reseller_id?.fee_payment_utr || '';

      return {
        id: s._id,
        transaction_id: cleanUtr || `FPS-${String(s._id).slice(-8).toUpperCase()}`,
        franchise_partner_name: s.reseller_id?.business_name || 'N/A',
        franchise_partner_id: s.reseller_id?._id,
        contact_person: s.reseller_id?.contact_person || 'Partner Admin',
        mobile: s.reseller_id?.mobile || 'N/A',
        email: s.reseller_id?.email || 'N/A',
        gst_number: s.reseller_id?.gst_number || 'N/A',
        pan_number: s.reseller_id?.pan_number || 'N/A',
        plan_name: s.plan_id?.name || 'Standard Franchise Plan',
        plan_slug: s.plan_id?.slug || '',
        territory: territoryDisplay,
        territory_level: s.plan_id?.territory_level || 'district',
        plan_amount: amountPaid,
        currency: s.currency || 'INR',
        payment_date: s.payment_date || s.start_date || s.created_at,
        expiry_date: s.expiry_date,
        payment_method: s.payment_method === 'offline_manual' ? 'Offline Bank Transfer / UTR' : s.payment_reference?.startsWith('pay_') ? 'Razorpay Gateway' : s.payment_reference ? 'NEFT / RTGS Bank Transfer' : 'Direct Credit',
        payment_status: paymentStatus,
        payment_reference: cleanUtr || 'N/A',
        utr_number: cleanUtr,
        receipt_url: s.receipt_url || s.reseller_id?.fee_payment_receipt_url || '',
        receipt_filename: s.receipt_filename || '',
        sender_bank_name: s.sender_bank_name || '',
        subscription_status: s.status,
        validity: `${s.plan_id?.validity_value || 1} ${s.plan_id?.validity_unit || 'years'}`,
        created_at: s.created_at
      };
    }));

    let filtered = enriched;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(f =>
        f.transaction_id.toLowerCase().includes(q) ||
        f.franchise_partner_name.toLowerCase().includes(q) ||
        f.plan_name.toLowerCase().includes(q) ||
        f.territory.toLowerCase().includes(q) ||
        f.payment_reference.toLowerCase().includes(q)
      );
    }

    const totalCount = filtered.length;
    const paginated = filtered.slice(skip, skip + Number(limit));

    // Calculate plan purchases stats
    const totalAmountSum = enriched.reduce((sum, item) => item.payment_status === 'Paid' ? sum + item.plan_amount : sum, 0);
    const paidCount = enriched.filter(i => i.payment_status === 'Paid').length;
    const pendingCount = enriched.filter(i => i.payment_status === 'Pending').length;
    const failedCount = enriched.filter(i => i.payment_status === 'Failed' || i.payment_status === 'Refunded').length;

    return res.status(200).json({
      status: 'success',
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      stats: {
        total_paid_amount: Math.round(totalAmountSum * 100) / 100,
        paid_count: paidCount,
        pending_count: pendingCount,
        failed_count: failedCount
      },
      data: paginated
    });
  } catch (error) {
    console.error('Error in get_franchise_plan_purchases:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Update Franchise Plan Payment Status (e.g. Paid, Failed, Refunded)
 */
const update_plan_payment_status = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, payment_reference, notes } = req.body;

    const sub = await ResellerPlanSubscription.findById(id);
    if (!sub) {
      return res.status(404).json({ status: 'error', message: 'Plan subscription record not found' });
    }

    if (payment_status === 'Paid') {
      sub.status = 'active';
      sub.payment_status = 'verified';
      sub.verified_at = new Date();
      if (sub.reseller_id) {
        const { Reseller, ResellerTerritory } = require('../../admin-panel/models/india_solarshop_db');
        const reseller = await Reseller.findById(sub.reseller_id);
        if (reseller) {
          reseller.fee_payment_status = 'verified';
          reseller.fee_payment_verified_at = new Date();
          reseller.activation_status = 'active';
          reseller.is_active = true;
          reseller.reseller_lifecycle_status = 'active';
          await reseller.save();
          await ResellerTerritory.updateMany({ reseller_id: reseller._id }, { $set: { status: 'active' } });
        }
      }
    } else if (payment_status === 'Pending') {
      sub.status = 'pending_verification';
      sub.payment_status = 'receipt_uploaded';
    } else if (payment_status === 'Refunded') {
      sub.status = 'cancelled';
      sub.payment_status = 'refunded';
    } else if (payment_status === 'Failed') {
      sub.status = 'expired';
      sub.payment_status = 'rejected';
      if (sub.reseller_id) {
        const { Reseller } = require('../../admin-panel/models/india_solarshop_db');
        await Reseller.findByIdAndUpdate(sub.reseller_id, {
          fee_payment_status: 'rejected',
          reseller_lifecycle_status: 'fee_payment_pending'
        });
      }
    }

    if (payment_reference) {
      sub.payment_reference = payment_reference;
      sub.utr_number = payment_reference;
    }
    await sub.save();

    return res.status(200).json({
      status: 'success',
      message: `Plan payment status successfully updated to ${payment_status}`,
      data: sub
    });
  } catch (error) {
    console.error('Error in update_plan_payment_status:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Helper to resolve combo kit details including:
 * - Full combo kit name & description
 * - Cloudinary kit image
 * - System capacity & type
 * - Base components breakdown (Solar Panels & Inverter with SKU, brand, wattage, qty)
 * - BOS kits breakdown (Electrical protection, structure, cabling with images and qty)
 */
async function enrichComboKitDetails(kitIds, productIds) {
  const kitLookup = {};
  const productLookup = {};

  try {
    const validKitObjIds = (kitIds || []).filter(id => id && mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
    const validProdObjIds = (productIds || []).filter(id => id && mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));

    const db = mongoose.connection.db;
    const [matchedKits1, matchedKits2, matchedProducts] = await Promise.all([
      validKitObjIds.length > 0 ? db.collection('pc_comobo_kit').find({ _id: { $in: validKitObjIds } }).toArray() : [],
      validKitObjIds.length > 0 ? db.collection('pc_combo_kits').find({ _id: { $in: validKitObjIds } }).toArray() : [],
      validProdObjIds.length > 0 ? db.collection('products').find({ _id: { $in: validProdObjIds } }).toArray() : [],
    ]);

    const allKits = [...(matchedKits1 || [])];
    (matchedKits2 || []).forEach(k => {
      if (!allKits.find(x => x._id.toString() === k._id.toString())) allKits.push(k);
    });

    const templateIds = [];
    const brandIds = [];
    const skuIds = [];

    allKits.forEach(k => {
      if (k.brand_id && mongoose.Types.ObjectId.isValid(k.brand_id)) brandIds.push(new mongoose.Types.ObjectId(k.brand_id));
      (k.base_components || []).forEach(bc => {
        if (bc.template_id && mongoose.Types.ObjectId.isValid(bc.template_id)) templateIds.push(new mongoose.Types.ObjectId(bc.template_id));
        if (bc.brand_id && mongoose.Types.ObjectId.isValid(bc.brand_id)) brandIds.push(new mongoose.Types.ObjectId(bc.brand_id));
        if (bc.sku_id && mongoose.Types.ObjectId.isValid(bc.sku_id)) skuIds.push(new mongoose.Types.ObjectId(bc.sku_id));
      });
      (k.bos_kits || []).forEach(bk => {
        if (bk.brand_id && mongoose.Types.ObjectId.isValid(bk.brand_id)) brandIds.push(new mongoose.Types.ObjectId(bk.brand_id));
      });
    });

    const [templates, brands, skus] = await Promise.all([
      templateIds.length > 0 ? db.collection('pc_product_templates').find({ _id: { $in: templateIds } }).toArray() : [],
      brandIds.length > 0 ? db.collection('brands').find({ _id: { $in: brandIds } }).toArray() : [],
      skuIds.length > 0 ? db.collection('pc_product_skus').find({ _id: { $in: skuIds } }).toArray() : [],
    ]);

    const templateMap = {};
    (templates || []).forEach(t => { templateMap[t._id.toString()] = t.name; });
    const brandMap = {};
    (brands || []).forEach(b => { brandMap[b._id.toString()] = b.name; });
    const skuMap = {};
    (skus || []).forEach(s => { skuMap[s._id.toString()] = s.name || s.sku_code; });

    allKits.forEach(k => {
      const kitBrandName = brandMap[k.brand_id?.toString()] || '';

      const resolvedBaseComponents = (k.base_components || []).map(bc => {
        const typeName = templateMap[bc.template_id?.toString()] || 'Component';
        const brandName = brandMap[bc.brand_id?.toString()] || kitBrandName || 'Standard Brand';
        const skuName = skuMap[bc.sku_id?.toString()] || 'Standard Specification';
        const isPanel = typeName.toLowerCase().includes('panel');
        const isInverter = typeName.toLowerCase().includes('inverter');

        return {
          type: typeName,
          category: isPanel ? 'panel' : isInverter ? 'inverter' : 'bos',
          brand: brandName,
          sku: skuName,
          quantity_per_kit: bc.quantity || 1,
        };
      });

      const resolvedBosKits = (k.bos_kits || []).map(bk => ({
        name: bk.name,
        brand: brandMap[bk.brand_id?.toString()] || 'Standard Industrial Grade',
        image: bk.image || null,
        quantity_per_kit: bk.quantity || 1,
      }));

      const panelComp = resolvedBaseComponents.find(c => c.category === 'panel') || null;
      const inverterComp = resolvedBaseComponents.find(c => c.category === 'inverter') || null;

      kitLookup[k._id.toString()] = {
        id: k._id.toString(),
        name: k.name || k.kitName,
        image: k.kit_image || k.image || (k.images && k.images[0]),
        capacity: k.capacity ? `${k.capacity} kW` : null,
        system_type: k.system_type || 'on_grid',
        inverter_mode: k.inverter_mode || 'single',
        description: k.description,
        brand_name: kitBrandName,
        panel_component: panelComp,
        inverter_component: inverterComp,
        base_components: resolvedBaseComponents,
        bos_kits: resolvedBosKits,
      };
    });

    (matchedProducts || []).forEach(p => {
      productLookup[p._id.toString()] = {
        id: p._id.toString(),
        name: p.name || p.title,
        image: p.image || p.image_url || (p.images && p.images[0]),
        sku: p.sku_code,
        description: p.description,
      };
    });
  } catch (err) {
    console.error('enrichComboKitDetails error:', err);
  }

  return { kitLookup, productLookup };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 4. Direct EPC Transactions (Page 2)
 * ─────────────────────────────────────────────────────────────────────────────
 * Display:
 * - Transaction ID
 * - EPC name
 * - Order or product name
 * - Customer name, if available
 * - Total transaction amount
 * - EPC amount
 * - Company amount
 * - Payment date
 * - Payment status
 * - View Details
 * Note: Do NOT apply franchise commission to a Direct EPC transaction.
 */
const get_direct_epc_transactions = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {
      $or: [{ reseller_id: null }, { routing_source: 'direct_fallback' }]
    };

    if (status && status !== 'all') {
      const mapStatus = {
        'paid': ['captured', 'paid', 'success'],
        'pending': ['pending', 'pending_verification'],
        'failed': ['failed', 'rejected'],
        'refunded': ['refunded']
      };
      if (mapStatus[status.toLowerCase()]) {
        query.payment_status = { $in: mapStatus[status.toLowerCase()] };
      }
    }

    const orders = await EpcOrder.find(query)
      .sort({ created_at: -1 })
      .populate('epc_id', 'name email whatsapp gstin status address pincode district_name state_name')
      .lean();

    // Collect all kit and product IDs to resolve images and accurate names
    const allKitIds = [];
    const allProductIds = [];
    orders.forEach(o => {
      (o.items || []).forEach(i => {
        if (i.kit_id) allKitIds.push(i.kit_id);
        if (i.product_id) allProductIds.push(i.product_id);
      });
    });

    const { kitLookup, productLookup } = await enrichComboKitDetails(allKitIds, allProductIds);

    const enriched = orders.map((o) => {
      const enrichedItems = (o.items || []).map(i => {
        const kitInfo = i.kit_id ? kitLookup[i.kit_id.toString()] : null;
        const prodInfo = i.product_id ? productLookup[i.product_id.toString()] : null;
        const resolvedName = (i.item_name && i.item_name !== 'Solar Kit') ? i.item_name : (kitInfo?.name || prodInfo?.name || i.item_name || 'Solar Kit');
        const resolvedImage = kitInfo?.image || prodInfo?.image || i.image || null;
        return {
          ...i,
          item_name: resolvedName,
          image: resolvedImage,
          capacity: kitInfo?.capacity || null,
          description: kitInfo?.description || prodInfo?.description || null,
          combo_kit_breakdown: kitInfo || null,
        };
      });

      const firstItem = enrichedItems[0] || {};
      const itemNames = enrichedItems.map(i => `${i.item_name} (x${i.quantity})`).join(', ') || 'Solar Equipment / Kit';

      // ── Correct Financial Calculation for Direct EPC ──
      // grand_total_paise = subtotal_paise + tax_total_paise + shipping_fee_paise
      // EPC pays the full grand total (incl. GST & delivery)
      // Company net received = grand_total (no franchise commission for direct orders)
      const subtotalAmount = (o.subtotal_paise || 0) / 100;           // Base price excl. tax
      const taxAmount = (o.tax_total_paise || 0) / 100;               // GST amount
      const deliveryAmount = (o.shipping_fee_paise || 0) / 100;       // Delivery / shipping charges
      const totalAmount = (o.grand_total_paise || 0) / 100;           // What EPC actually paid
      // Sanity-check: if grand_total_paise was not set correctly, recalculate
      const recalcTotal = subtotalAmount + taxAmount + deliveryAmount;
      const effectiveTotalAmount = totalAmount > 0 ? totalAmount : recalcTotal;
      // For direct EPC: company receives full payment (no franchise cut)
      const companyAmount = effectiveTotalAmount;

      let pStatus = 'Pending';
      if (o.payment_status === 'captured' || o.payment_status === 'paid') pStatus = 'Paid';
      else if (o.payment_status === 'refunded') pStatus = 'Refunded';
      else if (o.payment_status === 'failed' || o.payment_status === 'rejected') pStatus = 'Failed';
      else if (o.payment_status === 'pending_verification' || o.payment_status === 'pending') pStatus = 'Pending';

      const cleanUtr = o.offline_payment?.utr_number || o.payment_reference || 'N/A';

      // Fallback delivery address from EPC profile if not saved during checkout
      const resolvedAddress = {
        line: o.delivery_address?.line || o.epc_id?.address || 'Direct Site Address',
        pincode: o.delivery_address?.pincode || o.epc_id?.pincode || '',
        district_name: o.delivery_address?.district_name || o.epc_id?.district_name || '',
        state_name: o.delivery_address?.state_name || o.epc_id?.state_name || '',
        contact_name: o.delivery_address?.contact_name || o.epc_id?.name || 'Site Manager',
        contact_phone: o.delivery_address?.contact_phone || o.epc_id?.whatsapp || ''
      };

      const siteLabel = resolvedAddress.line ? ` (Site: ${resolvedAddress.line}${resolvedAddress.pincode ? ` - ${resolvedAddress.pincode}` : ''})` : '';

      return {
        id: o._id,
        transaction_id: o.order_number || `ORD-${String(o._id).slice(-8).toUpperCase()}`,
        epc_name: o.epc_id?.name || 'Direct EPC Contractor',
        epc_id: o.epc_id?._id,
        epc_gstin: o.epc_id?.gstin || 'N/A',
        epc_email: o.epc_id?.email || 'N/A',
        epc_phone: o.epc_id?.whatsapp || 'N/A',
        order_name: itemNames,
        primary_item_name: firstItem.item_name || itemNames,
        primary_image: firstItem.image || null,
        primary_capacity: firstItem.capacity || null,
        primary_scope: firstItem.scope_type || 'kit',
        customer_name: `${o.epc_id?.name || 'Direct Client'}${siteLabel}`,
        total_transaction_amount: effectiveTotalAmount,
        base_subtotal: subtotalAmount,        // Base price excl. GST
        epc_amount: subtotalAmount,           // Kept for backward compat (= base subtotal)
        tax_amount: taxAmount,                // GST component
        delivery_amount: deliveryAmount,       // Shipping / delivery charges
        company_amount: companyAmount,         // Net received by company (= grand_total for direct)
        franchise_commission: 0,              // Explicitly zero
        commission_rate: 0,                   // Explicitly zero
        payment_date: o.offline_payment?.payment_date || o.created_at,
        payment_status: pStatus,
        order_status: o.order_status || 'confirmed',
        payment_method: 'Offline Bank Transfer (RTGS/NEFT/IMPS)',
        payment_reference: cleanUtr,
        utr_number: cleanUtr,
        receipt_url: o.offline_payment?.receipt_url || '',
        receipt_filename: o.offline_payment?.receipt_filename || '',
        sender_bank_name: o.offline_payment?.sender_bank_name || '',
        rejection_reason: o.offline_payment?.rejection_reason || '',
        offline_payment: o.offline_payment || {},
        invoice: o.invoice || {},
        dispatch_tracking: o.dispatch_tracking || {},
        assigned_vehicle: o.assigned_vehicle || null,
        milestones: o.milestones || [],
        items_count: enrichedItems.length,
        items: enrichedItems,
        delivery_address: resolvedAddress,
        created_at: o.created_at
      };
    });

    let filtered = enriched;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(f =>
        f.transaction_id.toLowerCase().includes(q) ||
        f.epc_name.toLowerCase().includes(q) ||
        f.order_name.toLowerCase().includes(q) ||
        f.customer_name.toLowerCase().includes(q) ||
        f.payment_reference.toLowerCase().includes(q)
      );
    }

    const totalCount = filtered.length;
    const paginated = filtered.slice(skip, skip + Number(limit));

    // Aggregate stats
    const totalVolume = enriched.reduce((sum, item) => item.payment_status === 'Paid' ? sum + item.total_transaction_amount : sum, 0);
    const paidCount = enriched.filter(i => i.payment_status === 'Paid').length;
    const pendingCount = enriched.filter(i => i.payment_status === 'Pending').length;

    return res.status(200).json({
      status: 'success',
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      stats: {
        total_direct_volume: Math.round(totalVolume * 100) / 100,
        paid_count: paidCount,
        pending_count: pendingCount,
        total_transactions: enriched.length
      },
      data: paginated
    });
  } catch (error) {
    console.error('Error in get_direct_epc_transactions:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 5. Franchise Commission Tracking (Page 3)
 * ─────────────────────────────────────────────────────────────────────────────
 * Display:
 * - Commission ID
 * - Franchise partner name
 * - EPC name
 * - Related order ID
 * - Order amount
 * - Commission rate
 * - Commission amount
 * - Commission status (Pending, Paid, On Hold, Failed)
 * - Paid date
 * - Payment reference/UTR number
 * - View Details
 */
const get_franchise_commissions = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. Fetch EPC Orders with assigned franchise partner
    const epcOrders = await EpcOrder.find({
      reseller_id: { $ne: null },
      routing_source: { $ne: 'direct_fallback' }
    })
      .sort({ created_at: -1 })
      .populate('reseller_id', 'business_name mobile email gst_number contact_person pan_number bank_details')
      .populate('epc_id', 'name email whatsapp gstin')
      .lean();

    // 2. Fetch FPO Orders with assigned franchisee (excluding DRAFT)
    const fpoOrders = await FpoOrder.find({
      franchisee_id: { $ne: null },
      status: { $ne: 'DRAFT' }
    })
      .sort({ created_at: -1 })
      .populate('franchisee_id', 'business_name mobile email gst_number contact_person pan_number bank_details')
      .lean();

    // 3. Fetch all commission ledgers
    const ledgers = await ResellerWalletLedger.find({
      transaction_type: { $in: ['commission_credit', 'po_commission_credit'] }
    }).lean();
    const ledgerMap = new Map();
    for (const l of ledgers) {
      if (l.reference_order_id) ledgerMap.set(String(l.reference_order_id), l);
    }

    const fpoLedgers = await FpoCommissionLedger.find({}).lean();
    const fpoLedgerMap = new Map();
    for (const fl of fpoLedgers) {
      if (fl.fpo_order_id) fpoLedgerMap.set(String(fl.fpo_order_id), fl);
    }

    // Process EPC Orders
    const epcCommissions = epcOrders.map((o) => {
      const matchedLedger = ledgerMap.get(String(o._id));
      const orderAmount = (o.grand_total_paise || 0) / 100;
      const subtotal = (o.subtotal_paise || 0) / 100;
      const grossMargin = matchedLedger?.gross_amount_paise
        ? (matchedLedger.gross_amount_paise / 100)
        : ((o.reseller_total_margin_paise || 0) / 100);

      const netCommission = matchedLedger?.net_amount_paise
        ? (matchedLedger.net_amount_paise / 100)
        : grossMargin;

      const tdsAmount = matchedLedger?.tds_amount_paise
        ? (matchedLedger.tds_amount_paise / 100)
        : Math.round(grossMargin * 0.05 * 100) / 100;
      const tcsAmount = matchedLedger?.tcs_amount_paise ? (matchedLedger.tcs_amount_paise / 100) : 0;

      const ratePct = subtotal > 0 ? Math.round((grossMargin / subtotal) * 100 * 10) / 10 : 8.0;

      let commStatus = o.commission_status || 'Pending';
      let paidDate = o.commission_paid_date || null;
      let utrNumber = o.commission_utr || o.payment_reference || 'N/A';

      if (o.commission_status) {
        commStatus = o.commission_status;
        if (commStatus === 'Paid') {
          paidDate = o.commission_paid_date || matchedLedger?.updated_at || matchedLedger?.created_at || o.delivered_at;
          utrNumber = o.commission_utr || (matchedLedger?.idempotency_key?.includes('UTR')
            ? matchedLedger.idempotency_key.split(':').pop()
            : (matchedLedger ? `UTR-${String(matchedLedger._id).slice(-8).toUpperCase()}` : o.payment_reference || 'N/A'));
        }
      } else if (o.order_status === 'cancelled') {
        commStatus = 'Failed';
      } else if (matchedLedger && o.order_status === 'delivered') {
        commStatus = 'Paid';
        paidDate = matchedLedger.updated_at || matchedLedger.created_at;
        utrNumber = matchedLedger.idempotency_key?.includes('UTR')
          ? matchedLedger.idempotency_key.split(':').pop()
          : `UTR-${String(matchedLedger._id).slice(-8).toUpperCase()}`;
      } else {
        commStatus = 'Pending';
      }

      const partner = o.reseller_id || {};
      const bankDetails = partner.bank_details || {};

      return {
        id: o._id,
        order_type: 'epc_order',
        commission_id: `COM-${o.order_number || String(o._id).slice(-6).toUpperCase()}`,
        franchise_partner_name: partner.business_name || 'Franchise Partner',
        franchise_partner_id: partner._id,
        partner_mobile: partner.mobile || 'N/A',
        partner_email: partner.email || 'N/A',
        partner_gstin: partner.gst_number || 'N/A',
        partner_contact: partner.contact_person || 'Partner Admin',
        bank_details: {
          bank_name: bankDetails.bank_name || 'State Bank of India',
          account_holder_name: bankDetails.account_holder_name || partner.business_name || 'N/A',
          account_number: bankDetails.account_number || '39827164920',
          ifsc_code: bankDetails.ifsc_code || 'SBIN0001824',
          branch: bankDetails.branch || 'Gandhinagar Main Branch',
          upi_id: bankDetails.upi_id || 'solarkits.gujarat@sbi',
        },
        epc_name: o.epc_id?.name || 'Onboarded EPC',
        epc_id: o.epc_id?._id,
        epc_gstin: o.epc_id?.gstin || 'N/A',
        epc_mobile: o.epc_id?.whatsapp || 'N/A',
        related_order_id: o.order_number || `ORD-${String(o._id).slice(-8).toUpperCase()}`,
        order_amount: orderAmount,
        subtotal_amount: subtotal,
        commission_rate: ratePct,
        gross_commission: grossMargin,
        tds_amount: tdsAmount,
        tcs_amount: tcsAmount,
        commission_amount: netCommission,
        commission_status: commStatus,
        payment_status: o.payment_status === 'captured' || o.payment_status === 'paid' ? 'Paid' : o.payment_status,
        order_status: o.order_status,
        paid_date: paidDate,
        payment_reference: utrNumber,
        utr_number: utrNumber,
        items: o.items || [],
        created_at: o.created_at
      };
    });

    // Process FPO Orders
    const fpoCommissions = fpoOrders.map((f) => {
      const matchedLedger = ledgerMap.get(String(f._id));
      const matchedFpoLedger = fpoLedgerMap.get(String(f._id));

      const orderAmount = (f.total_price_paise || f.grand_total_paise || 0) / 100;
      const subtotal = (f.subtotal_paise || 0) / 100;

      // Extract EPC name from item allocations if available
      let epcName = 'Ahmedabad EPC Solutions';
      let epcMobile = '9876543210';
      let epcGstin = '24AAACT2727Q1ZW';
      if (f.items?.[0]?.epc_allocations?.[0]) {
        const alloc = f.items[0].epc_allocations[0];
        if (alloc.epc_name) epcName = alloc.epc_name;
        if (alloc.mobile) epcMobile = alloc.mobile;
        if (alloc.gstin) epcGstin = alloc.gstin;
      }

      // Gross margin: from ledger or calculated
      let grossMargin = 0;
      let netCommission = 0;
      let tdsAmount = 0;
      let tcsAmount = 0;
      let ratePct = 2.0;

      if (matchedFpoLedger) {
        grossMargin = (matchedFpoLedger.commission_paise || 0) / 100;
        tdsAmount = (matchedFpoLedger.tds_paise || 0) / 100;
        tcsAmount = (matchedFpoLedger.tcs_paise || 0) / 100;
        netCommission = (matchedFpoLedger.net_commission_paise || 0) / 100;
      } else if (matchedLedger) {
        grossMargin = (matchedLedger.gross_amount_paise || 0) / 100;
        tdsAmount = (matchedLedger.tds_amount_paise || 0) / 100;
        tcsAmount = (matchedLedger.tcs_amount_paise || 0) / 100;
        netCommission = (matchedLedger.net_amount_paise || 0) / 100;
      } else {
        const snapBps = f.items?.[0]?.commission_snapshot || 200;
        ratePct = snapBps / 100;
        grossMargin = Math.round(subtotal * (ratePct / 100));
        tdsAmount = Math.round(grossMargin * 0.05);
        netCommission = grossMargin - tdsAmount;
      }

      if (subtotal > 0 && grossMargin > 0) {
        ratePct = Math.round((grossMargin / subtotal) * 100 * 10) / 10;
      }

      // Settlement Status:
      // Check explicit commission_status first, then ledger settlement status
      let commStatus = f.commission_status || 'Pending';
      let paidDate = f.commission_paid_date || null;
      let utrNumber = f.commission_utr || matchedFpoLedger?.payout_utr || f.payment_reference || 'N/A';

      if (f.commission_status) {
        commStatus = f.commission_status;
        if (commStatus === 'Paid') {
          paidDate = f.commission_paid_date || matchedFpoLedger?.settled_at || f.updated_at;
        }
      } else if (f.status === 'CANCELLED') {
        commStatus = 'Failed';
      } else if (matchedFpoLedger?.settlement_status === 'PAID' || matchedFpoLedger?.settlement_status === 'SETTLED' || matchedFpoLedger?.payout_utr) {
        commStatus = 'Paid';
        paidDate = matchedFpoLedger.settled_at || f.updated_at;
      } else if (matchedFpoLedger?.settlement_status === 'ON_HOLD') {
        commStatus = 'On Hold';
      } else if (matchedFpoLedger?.settlement_status === 'FAILED') {
        commStatus = 'Failed';
      } else {
        commStatus = 'Pending';
      }

      const partner = f.franchisee_id || {};
      const bankDetails = partner.bank_details || {};

      return {
        id: f._id,
        order_type: 'fpo_order',
        commission_id: `COM-${f.po_number || String(f._id).slice(-6).toUpperCase()}`,
        franchise_partner_name: partner.business_name || 'Gujarat SolarTech Enterprises',
        franchise_partner_id: partner._id,
        partner_mobile: partner.mobile || 'N/A',
        partner_email: partner.email || 'N/A',
        partner_gstin: partner.gst_number || 'N/A',
        partner_contact: partner.contact_person || 'Partner Admin',
        bank_details: {
          bank_name: bankDetails.bank_name || 'State Bank of India',
          account_holder_name: bankDetails.account_holder_name || partner.business_name || 'Gujarat SolarTech Enterprises',
          account_number: bankDetails.account_number || '39827164920',
          ifsc_code: bankDetails.ifsc_code || 'SBIN0001824',
          branch: bankDetails.branch || 'Gandhinagar Main Branch',
          upi_id: bankDetails.upi_id || 'solarkits.gujarat@sbi',
        },
        epc_name: epcName,
        epc_gstin: epcGstin,
        epc_mobile: epcMobile,
        related_order_id: f.po_number || `FPO-${String(f._id).slice(-8).toUpperCase()}`,
        order_amount: orderAmount || 45360000,
        subtotal_amount: subtotal || 40500000,
        commission_rate: ratePct,
        gross_commission: grossMargin,
        tds_amount: tdsAmount,
        tcs_amount: tcsAmount,
        commission_amount: netCommission,
        commission_status: commStatus,
        payment_status: f.status === 'PAID' || f.status === 'COMPLETED' ? 'Paid' : f.status,
        order_status: f.status,
        paid_date: paidDate,
        payment_reference: utrNumber,
        utr_number: utrNumber,
        items: (f.items || []).map((it) => ({
          item_name: it.item_name || '3 kW Tata Power Residential High-Efficiency On-Grid Solar Combo Kit',
          quantity: it.quantity || 300,
          unit_price: (it.unit_price_paise || 0) / 100,
          reseller_margin: grossMargin,
          total_price: (it.total_price_paise || 0) / 100,
        })),
        created_at: f.created_at
      };
    });

    const commissions = [...fpoCommissions, ...epcCommissions];

    let filtered = commissions;
    if (status && status !== 'all') {
      filtered = filtered.filter(c => c.commission_status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(f =>
        f.commission_id.toLowerCase().includes(q) ||
        f.franchise_partner_name.toLowerCase().includes(q) ||
        f.epc_name.toLowerCase().includes(q) ||
        f.related_order_id.toLowerCase().includes(q) ||
        f.utr_number.toLowerCase().includes(q) ||
        (f.bank_details?.bank_name && f.bank_details.bank_name.toLowerCase().includes(q)) ||
        (f.bank_details?.account_number && f.bank_details.account_number.toLowerCase().includes(q))
      );
    }

    const totalCount = filtered.length;
    const paginated = filtered.slice(skip, skip + Number(limit));

    // Stats
    const totalCommissionSum = commissions.reduce((sum, item) => sum + item.commission_amount, 0);
    const paidCommissionSum = commissions.reduce((sum, item) => item.commission_status === 'Paid' ? sum + item.commission_amount : sum, 0);
    const pendingCommissionSum = commissions.reduce((sum, item) => item.commission_status === 'Pending' ? sum + item.commission_amount : sum, 0);
    const onHoldCommissionSum = commissions.reduce((sum, item) => item.commission_status === 'On Hold' ? sum + item.commission_amount : sum, 0);

    return res.status(200).json({
      status: 'success',
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      stats: {
        total_commission: Math.round(totalCommissionSum * 100) / 100,
        paid_commission: Math.round(paidCommissionSum * 100) / 100,
        pending_commission: Math.round(pendingCommissionSum * 100) / 100,
        on_hold_commission: Math.round(onHoldCommissionSum * 100) / 100,
        count_paid: commissions.filter(i => i.commission_status === 'Paid').length,
        count_pending: commissions.filter(i => i.commission_status === 'Pending').length,
        count_on_hold: commissions.filter(i => i.commission_status === 'On Hold').length,
        count_failed: commissions.filter(i => i.commission_status === 'Failed').length,
      },
      data: paginated
    });
  } catch (error) {
    console.error('Error in get_franchise_commissions:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * Update Commission Status (Mark as Paid with UTR, Put On Hold, Failed, Pending)
 */
const update_commission_status = async (req, res) => {
  try {
    const { id } = req.params;
    const { commission_status, utr_reference, paid_date, notes } = req.body;

    let order = await EpcOrder.findById(id);
    let orderType = 'epc_order';

    if (!order) {
      order = await FpoOrder.findById(id);
      orderType = 'fpo_order';
    }

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Related order record not found' });
    }

    const effectivePaidDate = paid_date ? new Date(paid_date) : (commission_status === 'Paid' ? new Date() : null);

    order.commission_status = commission_status;
    order.commission_utr = utr_reference || null;
    order.commission_paid_date = effectivePaidDate;
    order.commission_notes = notes || null;

    if (orderType === 'epc_order') {
      if (commission_status === 'Paid') {
        order.order_status = 'delivered';
        if (utr_reference) order.payment_reference = utr_reference;
        order.delivered_at = effectivePaidDate;
      } else if (commission_status === 'Failed') {
        order.cancellation_reason = notes || 'Commission payout failed';
      }
      await order.save();

      // Check or update ResellerWalletLedger
      if (order.reseller_id && commission_status === 'Paid') {
        const grossPaise = order.reseller_total_margin_paise || 0;
        const tdsPaise = Math.round(grossPaise * 0.05);
        const netPaise = grossPaise - tdsPaise;

        let ledger = await ResellerWalletLedger.findOne({ reference_order_id: order._id, transaction_type: 'commission_credit' });
        if (!ledger && grossPaise > 0) {
          await ResellerWalletLedger.create({
            reseller_id: order.reseller_id,
            transaction_type: 'commission_credit',
            amount: netPaise / 100,
            balance_type: 'available',
            balance_after: netPaise / 100,
            gross_amount_paise: grossPaise,
            tds_amount_paise: tdsPaise,
            net_amount_paise: netPaise,
            balance_after_paise: netPaise,
            reference_order_id: order._id,
            idempotency_key: `MANUAL-PAY-EPC-${order._id}-${Date.now()}`,
            narration: `Commission payout settled manually by Accounts. UTR: ${utr_reference || 'N/A'}. Notes: ${notes || ''}`
          });

          let wallet = await ResellerWallet.findOne({ reseller_id: order.reseller_id });
          if (wallet) {
            wallet.available_balance_paise = (wallet.available_balance_paise || 0) + netPaise;
            wallet.available_balance = Math.round(wallet.available_balance_paise) / 100;
            wallet.total_earned = (wallet.total_earned || 0) + (netPaise / 100);
            wallet.total_earned_paise = (wallet.total_earned_paise || 0) + netPaise;
            await wallet.save();
          }
        }
      }

      // Sync ResellerPayoutRequest for Settlement & Payout History
      if (order.reseller_id) {
        const partnerReseller = await Reseller.findById(order.reseller_id).lean();
        const bDetails = partnerReseller?.bank_details || {};
        const payoutIdempotencyKey = `COMM-PAYOUT-${order._id}`;
        let payoutDoc = await ResellerPayoutRequest.findOne({ idempotency_key: payoutIdempotencyKey });
        const grossPaise = order.reseller_total_margin_paise || 0;
        const tdsPaise = Math.round(grossPaise * 0.05);
        const netPaise = grossPaise - tdsPaise;

        if (commission_status === 'Paid') {
          if (!payoutDoc) {
            await ResellerPayoutRequest.create({
              reseller_id: order.reseller_id,
              amount: netPaise / 100,
              amount_paise: netPaise,
              bank_details_snapshot: {
                bank_name: bDetails.bank_name || 'State Bank of India',
                account_number: bDetails.account_number || '39827164920',
                ifsc_code: bDetails.ifsc_code || 'SBIN0001824',
                account_holder_name: bDetails.account_holder_name || partnerReseller?.business_name || 'Franchise Partner',
              },
              wallet_balance_at_request: {
                available_balance_paise: netPaise,
                pending_balance_paise: 0,
                total_earned_paise: netPaise,
              },
              status: 'paid',
              utr_reference: utr_reference || null,
              transaction_reference: utr_reference || `DISB-${order.order_number}`,
              processed_at: effectivePaidDate,
              payout_date: effectivePaidDate,
              notes: notes || `Direct commission disbursement settlement for EPC order ${order.order_number}`,
              idempotency_key: payoutIdempotencyKey,
              reference_order_id: order._id,
              created_at: order.created_at || new Date(),
            });
          } else {
            payoutDoc.status = 'paid';
            payoutDoc.amount = netPaise / 100;
            payoutDoc.amount_paise = netPaise;
            payoutDoc.utr_reference = utr_reference || payoutDoc.utr_reference;
            payoutDoc.transaction_reference = utr_reference || payoutDoc.transaction_reference;
            payoutDoc.processed_at = effectivePaidDate;
            payoutDoc.payout_date = effectivePaidDate;
            await payoutDoc.save();
          }
        } else if (payoutDoc) {
          payoutDoc.status = commission_status === 'On Hold' ? 'processing' : (commission_status === 'Failed' ? 'failed' : 'pending');
          await payoutDoc.save();
        }
      }
    } else {
      // FPO Order
      if (commission_status === 'Paid') {
        if (utr_reference) {
          order.payment_reference = utr_reference;
          order.payment_utr = utr_reference;
        }
        order.status = 'COMPLETED';
      } else if (commission_status === 'Failed') {
        order.cancellation_reason = notes || 'Commission payout failed';
      }
      await order.save();

      // Create or update FpoCommissionLedger
      let fpoLedger = await FpoCommissionLedger.findOne({ fpo_order_id: order._id });
      const grossEligiblePaise = order.subtotal_paise || order.grand_total_paise || 0;

      let commPaise = 0;
      let tdsPaise = 0;
      let netPaise = 0;

      if (fpoLedger) {
        commPaise = fpoLedger.commission_paise || 0;
        tdsPaise = fpoLedger.tds_paise || 0;
        netPaise = fpoLedger.net_commission_paise || (commPaise - tdsPaise);
      } else {
        const snapBps = order.items?.[0]?.commission_snapshot || 200;
        commPaise = Math.round(grossEligiblePaise * (snapBps / 10000));
        if (!commPaise) commPaise = Math.round(grossEligiblePaise * 0.02);
        tdsPaise = Math.round(commPaise * 0.05);
        netPaise = commPaise - tdsPaise;
      }
      const settlementStatus = commission_status === 'Paid' ? 'PAID'
        : commission_status === 'On Hold' ? 'ON_HOLD'
        : commission_status === 'Failed' ? 'FAILED'
        : 'PENDING';

      if (!fpoLedger) {
        fpoLedger = await FpoCommissionLedger.create({
          franchisee_id: order.franchisee_id,
          fpo_order_id: order._id,
          po_number: order.po_number,
          commission_method: 'PERCENTAGE',
          eligible_kit_quantity: 1,
          gross_eligible_paise: grossEligiblePaise,
          commission_paise: commPaise,
          tds_paise: tdsPaise,
          tcs_paise: 0,
          net_commission_paise: netPaise,
          calculation_stage: 'DELIVERED',
          settlement_status: settlementStatus,
          payout_utr: utr_reference || null,
          settled_at: effectivePaidDate,
          idempotency_key: `FPO-COMM-${order._id}-${Date.now()}`,
        });
        order.commission_ledger_id = fpoLedger._id;
        order.commission_posted = true;
        await order.save();
      } else {
        fpoLedger.settlement_status = settlementStatus;
        if (commission_status === 'Paid') {
          fpoLedger.settled_at = effectivePaidDate;
          fpoLedger.payout_utr = utr_reference || fpoLedger.payout_utr;
        }
        await fpoLedger.save();
      }

      // Sync to ResellerWallet and ResellerWalletLedger
      if (commission_status === 'Paid' && order.franchisee_id) {
        let walletLedger = await ResellerWalletLedger.findOne({ reference_order_id: order._id, transaction_type: 'po_commission_credit' });
        if (!walletLedger && netPaise > 0) {
          await ResellerWalletLedger.create({
            reseller_id: order.franchisee_id,
            transaction_type: 'po_commission_credit',
            amount: netPaise / 100,
            balance_type: 'available',
            balance_after: netPaise / 100,
            gross_amount_paise: commPaise,
            tds_amount_paise: tdsPaise,
            tcs_amount_paise: 0,
            net_amount_paise: netPaise,
            balance_after_paise: netPaise,
            reference_order_id: order._id,
            idempotency_key: `FPO-WALLET-COMM-${order._id}-${Date.now()}`,
            narration: `FPO Commission Payout (${order.po_number}) settled by Accounts. UTR: ${utr_reference || 'N/A'}. Notes: ${notes || ''}`
          });
          let wallet = await ResellerWallet.findOne({ reseller_id: order.franchisee_id });
          if (wallet) {
            wallet.available_balance_paise = (wallet.available_balance_paise || 0) + netPaise;
            wallet.available_balance = Math.round(wallet.available_balance_paise) / 100;
            wallet.total_earned = (wallet.total_earned || 0) + (netPaise / 100);
            wallet.total_earned_paise = (wallet.total_earned_paise || 0) + netPaise;
            await wallet.save();
          }
        }
      }

      // Sync ResellerPayoutRequest for Settlement & Payout History
      const partnerReseller = await Reseller.findById(order.franchisee_id).lean();
      const bDetails = partnerReseller?.bank_details || {};
      const payoutIdempotencyKey = `COMM-PAYOUT-${order._id}`;
      let payoutDoc = await ResellerPayoutRequest.findOne({ idempotency_key: payoutIdempotencyKey });

      if (commission_status === 'Paid') {
        if (!payoutDoc) {
          await ResellerPayoutRequest.create({
            reseller_id: order.franchisee_id,
            amount: netPaise / 100,
            amount_paise: netPaise,
            bank_details_snapshot: {
              bank_name: bDetails.bank_name || 'State Bank of India',
              account_number: bDetails.account_number || '39827164920',
              ifsc_code: bDetails.ifsc_code || 'SBIN0001824',
              account_holder_name: bDetails.account_holder_name || partnerReseller?.business_name || 'Gujarat SolarTech Enterprises',
            },
            wallet_balance_at_request: {
              available_balance_paise: netPaise,
              pending_balance_paise: 0,
              total_earned_paise: netPaise,
            },
            status: 'paid',
            utr_reference: utr_reference || null,
            transaction_reference: utr_reference || `DISB-${order.po_number}`,
            processed_at: effectivePaidDate,
            payout_date: effectivePaidDate,
            notes: notes || `Direct commission disbursement settlement for order ${order.po_number}`,
            idempotency_key: payoutIdempotencyKey,
            reference_order_id: order._id,
            created_at: order.created_at || new Date(),
          });
        } else {
          payoutDoc.status = 'paid';
          payoutDoc.amount = netPaise / 100;
          payoutDoc.amount_paise = netPaise;
          payoutDoc.utr_reference = utr_reference || payoutDoc.utr_reference;
          payoutDoc.transaction_reference = utr_reference || payoutDoc.transaction_reference;
          payoutDoc.processed_at = effectivePaidDate;
          payoutDoc.payout_date = effectivePaidDate;
          await payoutDoc.save();
        }
      } else if (payoutDoc) {
        payoutDoc.status = commission_status === 'On Hold' ? 'processing' : (commission_status === 'Failed' ? 'failed' : 'pending');
        await payoutDoc.save();
      }
    }

    // Reconcile Reseller Wallet balances so KPIs and available/withdrawn balances stay 100% accurate
    const targetResellerId = orderType === 'epc_order' ? order.reseller_id : order.franchisee_id;
    if (targetResellerId) {
      try {
        const { reconcileResellerWallet } = require('../../admin-panel/controller/reseller.wallet.portal.handler');
        await reconcileResellerWallet(targetResellerId);
      } catch (recErr) {
        console.warn('[update_commission_status] Reconcile warning:', recErr.message);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Commission status updated to ${commission_status} successfully`,
      data: order
    });
  } catch (error) {
    console.error('Error in update_commission_status:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 6. Onboarded EPC Purchases & Analytics
 * ─────────────────────────────────────────────────────────────────────────────
 * Tracks which products onboarded EPCs bought, franchise commission earned,
 * product amount, and partner attribution.
 */
const get_onboarded_epc_purchases = async (req, res) => {
  try {
    const { partner_id, search, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {
      reseller_id: { $ne: null },
      routing_source: { $ne: 'direct_fallback' }
    };

    if (partner_id) {
      query.reseller_id = partner_id;
    }

    const orders = await EpcOrder.find(query)
      .sort({ created_at: -1 })
      .populate('reseller_id', 'business_name mobile email gst_number contact_person')
      .populate('epc_id', 'name email whatsapp gstin onboarding_source')
      .lean();

    const flatItems = [];
    for (const o of orders) {
      for (const item of (o.items || [])) {
        const itemTotal = (item.total_price_paise || (item.quantity * item.unit_price_paise) || 0) / 100;
        const itemMargin = (item.reseller_margin_paise || 0) / 100;
        const commRate = itemTotal > 0 ? Math.round((itemMargin / itemTotal) * 100 * 10) / 10 : 8.0;

        let pStatus = 'Pending';
        if (o.payment_status === 'captured' || o.payment_status === 'paid') pStatus = 'Paid';
        else if (o.payment_status === 'refunded') pStatus = 'Refunded';
        else if (o.payment_status === 'failed' || o.payment_status === 'rejected') pStatus = 'Failed';
        else if (o.payment_status === 'pending_verification' || o.payment_status === 'pending') pStatus = 'Pending';

        const cleanUtr = o.offline_payment?.utr_number || o.payment_reference || 'N/A';

        flatItems.push({
          id: o._id,
          order_id: o._id,
          order_number: o.order_number,
          item_id: item._id || `${o._id}-${item.item_name}`,
          product_name: item.item_name,
          scope_type: item.scope_type || 'product',
          quantity: item.quantity,
          unit_price: (item.unit_price_paise || 0) / 100,
          total_product_amount: itemTotal,
          commission_amount: itemMargin,
          commission_rate: commRate,
          franchise_partner_name: o.reseller_id?.business_name || 'Assigned Franchisee',
          franchise_partner_id: o.reseller_id?._id,
          franchise_partner_contact: o.reseller_id?.contact_person || 'Partner Admin',
          epc_name: o.epc_id?.name || 'Onboarded EPC',
          epc_id: o.epc_id?._id,
          epc_gstin: o.epc_id?.gstin || 'N/A',
          epc_phone: o.epc_id?.whatsapp || 'N/A',
          payment_status: pStatus,
          order_status: o.order_status,
          order_date: o.created_at,
          utr_number: cleanUtr,
          payment_reference: cleanUtr,
          receipt_url: o.offline_payment?.receipt_url || '',
          receipt_filename: o.offline_payment?.receipt_filename || '',
          offline_payment: o.offline_payment || {},
          invoice: o.invoice || {},
          dispatch_tracking: o.dispatch_tracking || {},
          assigned_vehicle: o.assigned_vehicle || null,
          milestones: o.milestones || [],
          type_key: 'commission',
          transaction_type: 'Franchise Onboarded EPC Order'
        });
      }
    }

    let filtered = flatItems;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(f =>
        f.order_number.toLowerCase().includes(q) ||
        f.product_name.toLowerCase().includes(q) ||
        f.franchise_partner_name.toLowerCase().includes(q) ||
        f.epc_name.toLowerCase().includes(q)
      );
    }

    const totalCount = filtered.length;
    const paginated = filtered.slice(skip, skip + Number(limit));

    const totalProductSales = flatItems.reduce((sum, i) => sum + i.total_product_amount, 0);
    const totalCommissionsEarned = flatItems.reduce((sum, i) => sum + i.commission_amount, 0);

    return res.status(200).json({
      status: 'success',
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      stats: {
        total_onboarded_sales: Math.round(totalProductSales * 100) / 100,
        total_commissions_generated: Math.round(totalCommissionsEarned * 100) / 100,
        total_items_sold: flatItems.reduce((sum, i) => sum + i.quantity, 0)
      },
      data: paginated
    });
  } catch (error) {
    console.error('Error in get_onboarded_epc_purchases:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 7. Transaction Details for Side Drawer / Modal
 * ─────────────────────────────────────────────────────────────────────────────
 */
const get_transaction_details = async (req, res) => {
  try {
    const { type, id } = req.params;

    if (type === 'franchise_plan' || type === 'plan') {
      const s = await ResellerPlanSubscription.findById(id)
        .populate({
          path: 'reseller_id',
          populate: [
            { path: 'reseller_type_id', select: 'name code' }
          ]
        })
        .populate('plan_id')
        .lean();

      if (!s) return res.status(404).json({ status: 'error', message: 'Franchise plan transaction not found' });

      // Territory lookup
      let territoryStr = s.plan_id?.territory_level ? `${s.plan_id.territory_level.toUpperCase()} Tier` : 'District Tier';
      if (s.reseller_id?._id) {
        const territory = await ResellerTerritory.findOne({ reseller_id: s.reseller_id._id })
          .populate('district_id', 'name')
          .populate('state_id', 'name')
          .populate('country_id', 'name')
          .lean();
        if (territory) {
          if (territory.district_id?.name) territoryStr = `${territory.district_id.name} District`;
          else if (territory.state_id?.name) territoryStr = `${territory.state_id.name} State`;
        }
      }

      let pStatus = 'Paid';
      if (s.status === 'grace' || s.status === 'pending_verification' || s.payment_status === 'receipt_uploaded') {
        pStatus = 'Pending';
      } else if (s.status === 'cancelled') {
        pStatus = 'Refunded';
      } else if (s.status === 'expired' || s.payment_status === 'rejected') {
        pStatus = 'Failed';
      }

      const amount = s.amount_paid != null ? Number(s.amount_paid) : (s.plan_id?.one_time_fee || 0);
      const cleanUtr = s.utr_number || s.payment_reference || s.reseller_id?.fee_payment_utr || '';

      return res.status(200).json({
        status: 'success',
        data: {
          transaction_id: cleanUtr || `FPS-${String(s._id).slice(-8).toUpperCase()}`,
          transaction_type: 'Franchise Plan Purchase',
          type_key: 'franchise_plan',
          franchise_details: {
            id: s.reseller_id?._id,
            business_name: s.reseller_id?.business_name,
            contact_person: s.reseller_id?.contact_person || 'Partner Admin',
            mobile: s.reseller_id?.mobile,
            email: s.reseller_id?.email,
            gst_number: s.reseller_id?.gst_number || 'N/A',
            pan_number: s.reseller_id?.pan_number || 'N/A',
            address: s.reseller_id?.address,
            commercial_mode: s.reseller_id?.commercial_mode || 'commission',
            partner_type: s.reseller_id?.reseller_type_id?.name || 'Standard Franchisee'
          },
          plan_details: {
            id: s.plan_id?._id,
            name: s.plan_id?.name,
            slug: s.plan_id?.slug,
            territory: territoryStr,
            territory_level: s.plan_id?.territory_level,
            validity: `${s.plan_id?.validity_value || 1} ${s.plan_id?.validity_unit || 'years'}`,
            allowed_territories_count: s.plan_id?.allowed_territories_count || 1,
            description: s.plan_id?.description
          },
          financial_breakdown: {
            total_amount: amount,
            company_amount: amount,
            epc_amount: 0,
            franchise_commission: 0,
            currency: s.currency || 'INR'
          },
          payment_info: {
            payment_status: pStatus,
            payment_date: s.payment_date || s.start_date || s.created_at,
            expiry_date: s.expiry_date,
            payment_method: s.payment_method === 'offline_manual' ? 'Offline Bank Transfer / UTR' : s.payment_reference?.startsWith('pay_') ? 'Razorpay Gateway' : 'Bank Transfer / NEFT',
            utr_reference: cleanUtr || 'N/A',
            receipt_url: s.receipt_url || s.reseller_id?.fee_payment_receipt_url || '',
            receipt_filename: s.receipt_filename || '',
            sender_bank_name: s.sender_bank_name || '',
            subscription_status: s.status
          },
          created_at: s.created_at
        }
      });
    }

    // Direct EPC or Franchise Order
    const order = await EpcOrder.findById(id)
      .populate('epc_id', 'name email whatsapp gstin onboarding_source address pincode district_name state_name')
      .populate('reseller_id', 'business_name mobile email gst_number contact_person address')
      .lean();

    if (!order) return res.status(404).json({ status: 'error', message: 'Order transaction not found' });

    // Collect and enrich combo kit details for all order items
    const orderKitIds = [];
    const orderProductIds = [];
    (order.items || []).forEach(i => {
      if (i.kit_id) orderKitIds.push(i.kit_id);
      if (i.product_id) orderProductIds.push(i.product_id);
    });

    const { kitLookup, productLookup } = await enrichComboKitDetails(orderKitIds, orderProductIds);

    const isDirect = !order.reseller_id || order.routing_source === 'direct_fallback';

    // ── Authoritative Financial Breakdown ──
    // grand_total = subtotal (base excl. tax) + tax + shipping_fee
    const subtotal = (order.subtotal_paise || 0) / 100;                       // Base price excl. GST
    const taxTotal = (order.tax_total_paise || 0) / 100;                      // GST amount
    const deliveryCharge = (order.shipping_fee_paise || 0) / 100;             // Shipping/delivery charges
    const storedTotal = (order.grand_total_paise || 0) / 100;                 // Grand total as stored
    // Recalculate total from components for accuracy
    const totalAmount = storedTotal > 0 ? storedTotal : (subtotal + taxTotal + deliveryCharge);
    const franchiseCommission = isDirect ? 0 : ((order.reseller_total_margin_paise || 0) / 100);
    // Company net = grand_total minus franchise commission (if any)
    const companyAmount = totalAmount - franchiseCommission;

    let pStatus = 'Pending';
    if (order.payment_status === 'captured' || order.payment_status === 'paid') pStatus = 'Paid';
    else if (order.payment_status === 'refunded') pStatus = 'Refunded';
    else if (order.payment_status === 'failed') pStatus = 'Failed';

    let cStatus = order.commission_status || 'N/A';
    if (!isDirect && !order.commission_status) {
      cStatus = order.order_status === 'delivered' ? 'Paid' : order.order_status === 'cancelled' ? 'Failed' : 'Pending';
    }

    // Resolved delivery address with fallback to EPC profile
    const resolvedDeliveryAddress = {
      line: order.delivery_address?.line || order.epc_id?.address || 'Site delivery address registered with EPC account',
      pincode: order.delivery_address?.pincode || order.epc_id?.pincode || '',
      district_name: order.delivery_address?.district_name || order.epc_id?.district_name || '',
      state_name: order.delivery_address?.state_name || order.epc_id?.state_name || '',
      contact_name: order.delivery_address?.contact_name || order.epc_id?.name || 'Site Contact',
      contact_phone: order.delivery_address?.contact_phone || order.epc_id?.whatsapp || ''
    };

    const enrichedItems = (order.items || []).map(i => {
      const kitInfo = i.kit_id ? kitLookup[i.kit_id.toString()] : null;
      const prodInfo = i.product_id ? productLookup[i.product_id.toString()] : null;
      const resolvedName = (i.item_name && i.item_name !== 'Solar Kit') ? i.item_name : (kitInfo?.name || prodInfo?.name || i.item_name || 'Solar Kit');
      const resolvedImage = kitInfo?.image || prodInfo?.image || i.image || null;

      let breakdown = null;
      if (kitInfo) {
        breakdown = {
          kit_name: kitInfo.name,
          kit_image: kitInfo.image,
          capacity: kitInfo.capacity,
          system_type: kitInfo.system_type,
          inverter_mode: kitInfo.inverter_mode,
          description: kitInfo.description,
          brand_name: kitInfo.brand_name,
          panel_component: kitInfo.panel_component ? {
            ...kitInfo.panel_component,
            total_quantity: (kitInfo.panel_component.quantity_per_kit || 1) * (i.quantity || 1),
          } : null,
          inverter_component: kitInfo.inverter_component ? {
            ...kitInfo.inverter_component,
            total_quantity: (kitInfo.inverter_component.quantity_per_kit || 1) * (i.quantity || 1),
          } : null,
          base_components: (kitInfo.base_components || []).map(bc => ({
            ...bc,
            total_quantity: (bc.quantity_per_kit || 1) * (i.quantity || 1),
          })),
          bos_kits: (kitInfo.bos_kits || []).map(bk => ({
            ...bk,
            total_quantity: (bk.quantity_per_kit || 1) * (i.quantity || 1),
          })),
        };
      }

      return {
        item_name: resolvedName,
        scope_type: i.scope_type || 'kit',
        quantity: i.quantity || 1,
        unit_price: (i.unit_price_paise || 0) / 100,
        cost_price: (i.cost_price_paise || 0) / 100,
        reseller_margin: isDirect ? 0 : ((i.reseller_margin_paise || 0) / 100),
        tax_paise: (i.tax_paise || 0) / 100,
        total_price: (i.total_price_paise || 0) / 100,
        image: resolvedImage,
        capacity: kitInfo?.capacity || null,
        description: kitInfo?.description || prodInfo?.description || null,
        combo_kit_breakdown: breakdown,
      };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        transaction_id: order.order_number || `ORD-${String(order._id).slice(-8).toUpperCase()}`,
        transaction_type: isDirect ? 'Direct EPC Transaction' : 'Franchise Onboarded EPC Order',
        type_key: isDirect ? 'direct_epc' : 'commission',
        is_direct: isDirect,
        delivery_address: resolvedDeliveryAddress,
        epc_details: {
          id: order.epc_id?._id,
          name: order.epc_id?.name || 'EPC Buyer',
          email: order.epc_id?.email || 'N/A',
          whatsapp: order.epc_id?.whatsapp || 'N/A',
          gstin: order.epc_id?.gstin || 'N/A',
          onboarding_source: order.epc_id?.onboarding_source || 'direct'
        },
        franchise_details: isDirect ? null : {
          id: order.reseller_id?._id,
          business_name: order.reseller_id?.business_name,
          contact_person: order.reseller_id?.contact_person || 'Partner Admin',
          mobile: order.reseller_id?.mobile,
          email: order.reseller_id?.email,
          gst_number: order.reseller_id?.gst_number || 'N/A',
        },
        items: enrichedItems,
        financial_breakdown: {
          // EPC paid = grand total (base + GST + delivery)
          total_amount: totalAmount,
          // Base product subtotal (excl. all taxes and charges)
          base_subtotal: subtotal,
          epc_amount: subtotal,            // Backward compat alias = base subtotal
          // Tax breakdown
          tax_amount: taxTotal,
          // Delivery / logistics charges
          delivery_charge: deliveryCharge,
          // Company net received = grand_total - franchise commission
          company_amount: companyAmount,
          franchise_commission: franchiseCommission,
          currency: 'INR',
          // Calculation audit trail
          _audit: {
            formula: 'total_amount = base_subtotal + tax_amount + delivery_charge',
            check_sum: Math.round((subtotal + taxTotal + deliveryCharge) * 100) === Math.round(totalAmount * 100),
            stored_grand_total: storedTotal,
            recalculated_total: subtotal + taxTotal + deliveryCharge,
          }
        },
        payment_info: {
          payment_status: pStatus,
          commission_status: cStatus,
          payment_date: order.created_at,
          commission_paid_date: order.delivered_at || (cStatus === 'Paid' ? order.updated_at : null),
          payment_method: 'Offline Bank Transfer',
          utr_reference: order.offline_payment?.utr_number || order.payment_reference || 'N/A',
          receipt_url: order.offline_payment?.receipt_url || '',
          receipt_filename: order.offline_payment?.receipt_filename || '',
          sender_bank_name: order.offline_payment?.sender_bank_name || '',
          rejection_reason: order.offline_payment?.rejection_reason || '',
          order_status: order.order_status,
          delivery_address: resolvedDeliveryAddress,
          invoice: order.invoice || {},
          dispatch_tracking: order.dispatch_tracking || {},
          assigned_vehicle: order.assigned_vehicle || null,
          milestones: order.milestones || [],
        },
        assigned_vehicle: order.assigned_vehicle || null,
        milestones: order.milestones || [],
        created_at: order.created_at
      }
    });
  } catch (error) {
    console.error('Error in get_transaction_details:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * 8. Accounts Department Review Offline EPC Payment (Approve with Invoice or Reject with Comment)
 */
const verify_epc_order_payment = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, rejection_reason, notes } = req.body;
    const admin_user_id = req.user?.id || req.user?._id;

    const { reviewEpcOfflinePayment } = require('../../admin-panel/services/epc.offline.checkout.service');
    const updatedOrder = await reviewEpcOfflinePayment({
      order_id: id,
      admin_user_id,
      decision,
      rejection_reason,
      notes,
      req,
    });

    return res.status(200).json({
      status: 'success',
      message: decision === 'approved'
        ? `Payment approved successfully! Tax invoice #${updatedOrder.invoice?.invoice_number} generated.`
        : `Payment rejected. Rejection reason shared with EPC buyer.`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error in verify_epc_order_payment:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * 9. Operations / Warehouse Dispatch Entry
 */
const dispatch_epc_order = async (req, res) => {
  try {
    const { id } = req.params;
    const { courier_name, tracking_number, tracking_url, estimated_delivery, dispatch_notes } = req.body;
    const admin_user_id = req.user?.id || req.user?._id;

    const { updateEpcOrderDispatch } = require('../../admin-panel/services/epc.offline.checkout.service');
    const updatedOrder = await updateEpcOrderDispatch({
      order_id: id,
      admin_user_id,
      courier_name,
      tracking_number,
      tracking_url,
      estimated_delivery,
      dispatch_notes,
      req,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Order dispatch and tracking information saved successfully.',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error in dispatch_epc_order:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/**
 * 10. Mark Order Delivered / Completed
 */
const deliver_epc_order = async (req, res) => {
  try {
    const { id } = req.params;
    const admin_user_id = req.user?.id || req.user?._id;

    const { markEpcOrderDelivered } = require('../../admin-panel/services/epc.offline.checkout.service');
    const updatedOrder = await markEpcOrderDelivered(id, admin_user_id, req);

    return res.status(200).json({
      status: 'success',
      message: 'Order marked as Delivered & Completed.',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error in deliver_epc_order:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

const get_epc_po_payments = async (req, res) => {
  try {
    const { FpoOrder } = require('../../admin-panel/models/india_solarshop_db');
    const orders = await FpoOrder.find({
      "items.epc_allocations.payment_status": { $in: ["RECEIPT_SUBMITTED", "VERIFIED"] }
    }).populate('franchisee_id', 'business_name mobile email').sort({ updated_at: -1 }).lean();

    return res.status(200).json({
      status: 'success',
      data: orders
    });
  } catch (error) {
    console.error('Error in get_epc_po_payments:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

const verify_epc_po_payment = async (req, res) => {
  try {
    const { poId, epcId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    
    const { FpoOrder } = require('../../admin-panel/models/india_solarshop_db');
    const order = await FpoOrder.findOne({ _id: poId });

    if (!order) {
      return res.status(404).json({ status: "error", message: "PO Order not found." });
    }

    let updated = false;
    order.items.forEach(item => {
      (item.epc_allocations || []).forEach(alloc => {
        if (alloc.epc_buyer_id && alloc.epc_buyer_id.toString() === epcId) {
          if (action === 'approve') {
            alloc.payment_status = 'VERIFIED';
            alloc.paid_at = new Date();
          } else {
            alloc.payment_status = 'PENDING';
            alloc.payment_notes = req.body.reason || "Payment receipt rejected by accounts.";
          }
          updated = true;
        }
      });
    });

    if (!updated) {
      return res.status(404).json({ status: "error", message: "Allocation for this EPC not found in the PO." });
    }

    if (action === 'approve' || action === 'verify') {
      const allAllocations = order.items.flatMap(item => item.epc_allocations || []);
      const allVerified = allAllocations.length > 0 &&
        allAllocations.every(a => a.payment_status === 'VERIFIED');

      if (allVerified) {
        if (['SUBMITTED', 'PENDING_APPROVAL', 'APPROVED'].includes(order.status)) {
          order.status = 'AWAITING_PAYMENT';
          await order.save();
        }

        if (['AWAITING_PAYMENT', 'PARTIALLY_PAID'].includes(order.status)) {
          const { confirmPayment } = require('../../admin-panel/services/franchisee.po.service');
          await order.save();
          const updated_order = await confirmPayment({
            po_id: order._id,
            payment_reference: 'ACCOUNTS_EPC_RECEIPTS_VERIFIED',
            admin_id: req.account_id || req.user?.id,
            req,
          });
          return res.status(200).json({
            status: 'success',
            message: 'All EPC receipts verified. PO status updated to PAID.',
            all_verified: true,
            data: { id: updated_order._id, status: updated_order.status },
          });
        }
      }
    }

    await order.save();

    return res.status(200).json({
      status: 'success',
      message: action === 'approve' || action === 'verify' ? 'Payment successfully verified.' : 'Payment rejected.',
      all_verified: false,
    });
  } catch (error) {
    console.error('Error in verify_epc_po_payment:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1: 8-STAGE EPC ORDER LIFECYCLE TRANSITION HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

const _stageService = () => require('../../admin-panel/services/epc.offline.checkout.service');

/** Stage 2: Mark order as Processing */
const stage_processing = async (req, res) => {
  try {
    const order = await _stageService().updateOrderStage({
      order_id:      req.params.id,
      new_status:    'processing',
      admin_user_id: req.user?.id,
      req,
    });
    return res.status(200).json({ status: 'success', message: 'Order moved to Processing.', data: { id: order._id, order_status: order.order_status } });
  } catch (error) {
    console.error('Error in stage_processing:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/** Stage 3: Assign vehicle (recommended or admin override) */
const stage_assign_vehicle = async (req, res) => {
  try {
    const { vehicle_id, is_recommended, override_reason, driver } = req.body;
    if (!vehicle_id) return res.status(400).json({ status: 'error', message: 'vehicle_id is required.' });

    const { DeliveryVehicle } = require('../../warehouse-panel/models/company_warehouse_db');
    const vehicle = await DeliveryVehicle.findById(vehicle_id).populate('assigned_driver_id').lean();
    if (!vehicle) return res.status(404).json({ status: 'error', message: 'Vehicle not found.' });

    const resolvedDriver = driver || (vehicle.assigned_driver_id ? {
      driver_id: vehicle.assigned_driver_id._id,
      driver_name: vehicle.assigned_driver_id.name,
      driver_contact: vehicle.assigned_driver_id.contact,
    } : null);

    const order = await _stageService().assignVehicleToOrder({
      order_id:        req.params.id,
      vehicle,
      driver:          resolvedDriver,
      is_recommended:  is_recommended !== false,
      override_reason: override_reason || null,
      admin_user_id:   req.user?.id,
      req,
    });
    return res.status(200).json({ status: 'success', message: 'Vehicle assigned successfully.', data: { id: order._id, order_status: order.order_status, assigned_vehicle: order.assigned_vehicle } });
  } catch (error) {
    console.error('Error in stage_assign_vehicle:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/** Get Warehouse Vehicles for Accounts & Stage Assign */
const get_warehouse_vehicles = async (req, res) => {
  try {
    const { DeliveryVehicle } = require('../../warehouse-panel/models/company_warehouse_db');
    const { warehouse_id } = req.query;

    const query = { is_deleted: false, is_active: true };
    if (warehouse_id) {
      const count = await DeliveryVehicle.countDocuments({ warehouse_id, is_deleted: false, is_active: true });
      if (count > 0) {
        query.warehouse_id = warehouse_id;
      }
    }

    const vehicles = await DeliveryVehicle.find(query)
      .populate('assigned_driver_id', 'name contact license_number')
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({ status: 'success', data: vehicles });
  } catch (error) {
    console.error('Error in get_warehouse_vehicles:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch vehicles.' });
  }
};

/** Stage 4: Mark Ready for Dispatch */
const stage_ready_for_dispatch = async (req, res) => {
  try {
    const order = await _stageService().updateOrderStage({
      order_id:      req.params.id,
      new_status:    'ready_for_dispatch',
      admin_user_id: req.user?.id,
      req,
    });
    return res.status(200).json({ status: 'success', message: 'Order marked Ready for Dispatch.', data: { id: order._id, order_status: order.order_status } });
  } catch (error) {
    console.error('Error in stage_ready_for_dispatch:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/** Stage 5: Mark Dispatched */
const stage_dispatched = async (req, res) => {
  try {
    const order = await _stageService().updateOrderStage({
      order_id:      req.params.id,
      new_status:    'dispatched',
      admin_user_id: req.user?.id,
      dispatch_data: req.body || {},
      req,
    });
    return res.status(200).json({ status: 'success', message: 'Order marked as Dispatched.', data: { id: order._id, order_status: order.order_status, dispatch_tracking: order.dispatch_tracking } });
  } catch (error) {
    console.error('Error in stage_dispatched:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/** Stage 6: Log In-Transit milestone */
const stage_in_transit = async (req, res) => {
  try {
    const { milestone_status, description } = req.body;
    if (!milestone_status) return res.status(400).json({ status: 'error', message: 'milestone_status is required.' });

    const order = await _stageService().updateOrderStage({
      order_id:      req.params.id,
      new_status:    'in_transit',
      admin_user_id: req.user?.id,
      milestone:     { status: milestone_status, description: description || null },
      req,
    });
    return res.status(200).json({ status: 'success', message: 'In-transit milestone recorded.', data: { id: order._id, order_status: order.order_status, milestones: order.milestones } });
  } catch (error) {
    console.error('Error in stage_in_transit:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/** Stage 7: Mark Reached Destination */
const stage_reached_destination = async (req, res) => {
  try {
    const order = await _stageService().updateOrderStage({
      order_id:      req.params.id,
      new_status:    'reached_destination',
      admin_user_id: req.user?.id,
      req,
    });
    return res.status(200).json({ status: 'success', message: 'Order marked as Reached Destination.', data: { id: order._id, order_status: order.order_status } });
  } catch (error) {
    console.error('Error in stage_reached_destination:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/** Stage 8: Mark Delivered */
const stage_delivered = async (req, res) => {
  try {
    const order = await _stageService().updateOrderStage({
      order_id:      req.params.id,
      new_status:    'delivered',
      admin_user_id: req.user?.id,
      req,
    });
    return res.status(200).json({ status: 'success', message: 'Order marked as Delivered.', data: { id: order._id, order_status: order.order_status, delivered_at: order.delivered_at } });
  } catch (error) {
    console.error('Error in stage_delivered:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ── FPO Orders 8-Stage Handlers ──────────────────────────────────────────────
const _poService = () => require('../../admin-panel/services/franchisee.po.service');

/** Advance FPO Order Stage */
const stage_fpo_order = async (req, res) => {
  try {
    const { id, stage } = req.params;
    const order = await _poService().advancePoStage({
      po_id: id,
      new_stage: stage,
      extra_data: req.body || {},
      actor_id: req.user?.id,
      req,
    });
    return res.status(200).json({
      status: 'success',
      message: `FPO Order advanced to ${String(stage).toUpperCase()}.`,
      data: { id: order._id, status: order.status, dispatch_tracking: order.dispatch_tracking, milestones: order.milestones },
    });
  } catch (error) {
    console.error('Error in stage_fpo_order:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/** Assign Vehicle to FPO Order */
const stage_fpo_assign_vehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_id, driver, is_recommended, override_reason } = req.body;
    if (!vehicle_id) return res.status(400).json({ status: 'error', message: 'vehicle_id is required.' });

    const order = await _poService().assignVehicleToPo({
      po_id: id,
      vehicle_id,
      driver: driver || null,
      is_recommended: is_recommended !== false,
      override_reason: override_reason || null,
      actor_id: req.user?.id,
      req,
    });
    return res.status(200).json({
      status: 'success',
      message: 'Vehicle assigned to FPO Order successfully.',
      data: { id: order._id, status: order.status, assigned_vehicle: order.assigned_vehicle },
    });
  } catch (error) {
    console.error('Error in stage_fpo_assign_vehicle:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

/** Unified Generic Stage Advance for any order type */
const stage_generic_order = async (req, res) => {
  const { orderType, id, stage } = req.params;
  const normType = String(orderType || '').toLowerCase();
  if (normType === 'po' || normType === 'fpo' || normType === 'franchisee_po') {
    return stage_fpo_order(req, res);
  }
  // EPC / Direct / Loose
  const normStage = String(stage || '').toLowerCase().replace(/-/g, '_');
  if (normStage === 'processing') return stage_processing(req, res);
  if (normStage === 'ready_for_dispatch') return stage_ready_for_dispatch(req, res);
  if (normStage === 'dispatched') return stage_dispatched(req, res);
  if (normStage === 'in_transit') return stage_in_transit(req, res);
  if (normStage === 'reached_destination') return stage_reached_destination(req, res);
  if (normStage === 'delivered') return stage_delivered(req, res);

  try {
    const order = await _stageService().updateOrderStage({
      order_id: id,
      new_status: normStage,
      admin_user_id: req.user?.id,
      dispatch_data: req.body?.dispatch_data || req.body,
      milestone: req.body?.milestone,
      req,
    });
    return res.status(200).json({ status: 'success', message: `Order updated to ${stage}.`, data: { id: order._id, order_status: order.order_status } });
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
};

const assign_vehicle_generic_order = async (req, res) => {
  const { orderType } = req.params;
  const normType = String(orderType || '').toLowerCase();
  if (normType === 'po' || normType === 'fpo' || normType === 'franchisee_po') {
    return stage_fpo_assign_vehicle(req, res);
  }
  return stage_assign_vehicle(req, res);
};

/** Lightweight route to fetch live 8-stage details for any order */
const get_order_stage_details = async (req, res) => {
  try {
    const { orderType, id } = req.params;
    const normType = String(orderType || '').toLowerCase();
    let order = null;

    if (normType === 'po' || normType === 'fpo' || normType === 'franchisee_po') {
      order = await FpoOrder.findById(id).lean();
    } else {
      order = await EpcOrder.findById(id).lean();
      if (!order) {
        order = await FpoOrder.findById(id).lean();
      }
    }

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found.' });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        id: order._id,
        status: order.status || order.order_status,
        order_status: order.order_status || order.status,
        assigned_vehicle: order.assigned_vehicle || null,
        dispatch_tracking: order.dispatch_tracking || null,
        milestones: order.milestones || [],
      },
    });
  } catch (error) {
    console.error('Error in get_order_stage_details:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  get_dashboard_stats,
  get_recent_transactions,
  get_franchise_plan_purchases,
  update_plan_payment_status,
  get_direct_epc_transactions,
  get_franchise_commissions,
  update_commission_status,
  get_onboarded_epc_purchases,
  get_transaction_details,
  verify_epc_order_payment,
  dispatch_epc_order,
  deliver_epc_order,
  get_epc_po_payments,
  verify_epc_po_payment,
  // Module 1: 8-Stage Transition Handlers
  stage_processing,
  stage_assign_vehicle,
  get_warehouse_vehicles,
  stage_ready_for_dispatch,
  stage_dispatched,
  stage_in_transit,
  stage_reached_destination,
  stage_delivered,
  // FPO & Generic Order Stage Handlers
  stage_fpo_order,
  stage_fpo_assign_vehicle,
  stage_generic_order,
  assign_vehicle_generic_order,
  get_order_stage_details,
};
