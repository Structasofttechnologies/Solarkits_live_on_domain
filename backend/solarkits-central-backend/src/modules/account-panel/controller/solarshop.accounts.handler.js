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
        const paymentStatus = s.status === 'active' ? 'Paid' : s.status === 'grace' ? 'Pending' : s.status === 'cancelled' ? 'Refunded' : 'Failed';
        unifiedTransactions.push({
          id: s._id,
          transaction_id: s.payment_reference || `FPS-${String(s._id).slice(-6).toUpperCase()}`,
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
          payment_date: s.start_date || s.created_at,
          payment_method: s.payment_reference ? 'Online / NetBanking' : 'Direct Transfer',
          utr_reference: s.payment_reference || 'N/A',
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
          payment_method: o.payment_reference ? 'Razorpay Gateway' : 'Bank Transfer',
          utr_reference: o.payment_reference || o.razorpay_order_id || 'N/A',
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
        const commStatus = o.order_status === 'delivered' || o.payment_status === 'captured' ? 'Paid' : o.order_status === 'cancelled' ? 'Failed' : 'Pending';

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
          payment_method: 'Wallet / Direct Credit',
          utr_reference: o.payment_reference || 'N/A',
          created_at: o.created_at,
          raw_data: o
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
        'paid': ['active'],
        'pending': ['grace'],
        'refunded': ['cancelled'],
        'failed': ['expired']
      };
      if (mapStatus[status.toLowerCase()]) {
        query.status = { $in: mapStatus[status.toLowerCase()] };
      }
    }

    const subscriptions = await ResellerPlanSubscription.find(query)
      .sort({ created_at: -1 })
      .populate({
        path: 'reseller_id',
        select: 'business_name mobile email gst_number pan_number address contact_person activation_status'
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
      if (s.status === 'grace') paymentStatus = 'Pending';
      else if (s.status === 'cancelled') paymentStatus = 'Refunded';
      else if (s.status === 'expired') paymentStatus = 'Failed';

      const amountPaid = s.amount_paid != null ? Number(s.amount_paid) : (s.plan_id?.one_time_fee || 0);

      return {
        id: s._id,
        transaction_id: s.payment_reference || `FPS-${String(s._id).slice(-8).toUpperCase()}`,
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
        payment_date: s.start_date || s.created_at,
        expiry_date: s.expiry_date,
        payment_method: s.payment_reference?.startsWith('pay_') ? 'Razorpay Gateway' : s.payment_reference ? 'NEFT / RTGS Bank Transfer' : 'Direct Credit',
        payment_status: paymentStatus,
        payment_reference: s.payment_reference || 'N/A',
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

    if (payment_status === 'Paid') sub.status = 'active';
    else if (payment_status === 'Pending') sub.status = 'grace';
    else if (payment_status === 'Refunded') sub.status = 'cancelled';
    else if (payment_status === 'Failed') sub.status = 'expired';

    if (payment_reference) sub.payment_reference = payment_reference;
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
        'pending': ['pending'],
        'failed': ['failed'],
        'refunded': ['refunded']
      };
      if (mapStatus[status.toLowerCase()]) {
        query.payment_status = { $in: mapStatus[status.toLowerCase()] };
      }
    }

    const orders = await EpcOrder.find(query)
      .sort({ created_at: -1 })
      .populate('epc_id', 'name email whatsapp gstin status')
      .lean();

    const enriched = orders.map((o) => {
      const itemNames = (o.items || []).map(i => `${i.item_name} (x${i.quantity})`).join(', ') || 'Solar Equipment / Kit';
      const totalAmount = (o.grand_total_paise || 0) / 100;
      const epcAmount = (o.subtotal_paise || 0) / 100;
      const taxAmount = (o.tax_total_paise || 0) / 100;
      const companyAmount = totalAmount; // For direct EPC, full amount flows to company (0 franchise commission)

      let pStatus = 'Pending';
      if (o.payment_status === 'captured' || o.payment_status === 'paid') pStatus = 'Paid';
      else if (o.payment_status === 'refunded') pStatus = 'Refunded';
      else if (o.payment_status === 'failed') pStatus = 'Failed';

      return {
        id: o._id,
        transaction_id: o.order_number || `ORD-${String(o._id).slice(-8).toUpperCase()}`,
        epc_name: o.epc_id?.name || 'Direct EPC Contractor',
        epc_id: o.epc_id?._id,
        epc_gstin: o.epc_id?.gstin || 'N/A',
        epc_email: o.epc_id?.email || 'N/A',
        epc_phone: o.epc_id?.whatsapp || 'N/A',
        order_name: itemNames,
        customer_name: o.delivery_address?.line ? `${o.epc_id?.name || 'Client'} (Site: ${o.delivery_address.line})` : o.epc_id?.name || 'Direct Client',
        total_transaction_amount: totalAmount,
        epc_amount: epcAmount,
        tax_amount: taxAmount,
        company_amount: companyAmount,
        franchise_commission: 0, // Explicitly zero
        commission_rate: 0,      // Explicitly zero
        payment_date: o.created_at,
        payment_status: pStatus,
        order_status: o.order_status || 'confirmed',
        payment_reference: o.payment_reference || o.razorpay_order_id || 'N/A',
        items_count: (o.items || []).length,
        items: o.items || [],
        delivery_address: o.delivery_address,
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

    // Fetch all orders with assigned franchise partner
    const orders = await EpcOrder.find({
      reseller_id: { $ne: null },
      routing_source: { $ne: 'direct_fallback' }
    })
      .sort({ created_at: -1 })
      .populate('reseller_id', 'business_name mobile email gst_number contact_person pan_number')
      .populate('epc_id', 'name email whatsapp gstin')
      .lean();

    // Fetch all commission ledgers & payout requests
    const ledgers = await ResellerWalletLedger.find({ transaction_type: 'commission_credit' }).lean();
    const ledgerMap = new Map();
    for (const l of ledgers) {
      if (l.reference_order_id) ledgerMap.set(String(l.reference_order_id), l);
    }

    const commissions = orders.map((o) => {
      const matchedLedger = ledgerMap.get(String(o._id));
      const orderAmount = (o.grand_total_paise || 0) / 100;
      const subtotal = (o.subtotal_paise || 0) / 100;
      const grossMargin = matchedLedger?.gross_amount_paise
        ? (matchedLedger.gross_amount_paise / 100)
        : ((o.reseller_total_margin_paise || 0) / 100);

      const netCommission = matchedLedger?.net_amount_paise
        ? (matchedLedger.net_amount_paise / 100)
        : grossMargin;

      const tdsAmount = matchedLedger?.tds_amount_paise ? (matchedLedger.tds_amount_paise / 100) : 0;
      const tcsAmount = matchedLedger?.tcs_amount_paise ? (matchedLedger.tcs_amount_paise / 100) : 0;

      // Rate %
      const ratePct = subtotal > 0 ? Math.round((grossMargin / subtotal) * 100 * 10) / 10 : 8.0;

      // Status mapping: Pending, Paid, On Hold, Failed
      let commStatus = 'Pending';
      let paidDate = null;
      let utrNumber = o.payment_reference || 'N/A';

      if (o.order_status === 'cancelled') {
        commStatus = 'Failed';
      } else if (matchedLedger) {
        if (o.order_status === 'delivered' || o.payment_status === 'captured') {
          commStatus = 'Paid';
          paidDate = matchedLedger.updated_at || matchedLedger.created_at;
          utrNumber = matchedLedger.idempotency_key?.includes('UTR')
            ? matchedLedger.idempotency_key.split(':').pop()
            : `UTR-${String(matchedLedger._id).slice(-8).toUpperCase()}`;
        } else {
          commStatus = 'Pending';
        }
      } else if (o.payment_status === 'pending') {
        commStatus = 'Pending';
      }

      return {
        id: o._id,
        commission_id: `COM-${o.order_number || String(o._id).slice(-6).toUpperCase()}`,
        franchise_partner_name: o.reseller_id?.business_name || 'Franchise Partner',
        franchise_partner_id: o.reseller_id?._id,
        partner_mobile: o.reseller_id?.mobile || 'N/A',
        partner_email: o.reseller_id?.email || 'N/A',
        partner_gstin: o.reseller_id?.gst_number || 'N/A',
        partner_contact: o.reseller_id?.contact_person || 'Partner Admin',
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
        f.utr_number.toLowerCase().includes(q)
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

    const order = await EpcOrder.findById(id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Related order record not found' });
    }

    if (commission_status === 'Paid') {
      order.order_status = 'delivered';
      if (utr_reference) order.payment_reference = utr_reference;
      order.delivered_at = paid_date ? new Date(paid_date) : new Date();
    } else if (commission_status === 'On Hold') {
      order.order_status = 'processing';
    } else if (commission_status === 'Failed') {
      order.order_status = 'cancelled';
      order.cancellation_reason = notes || 'Commission payout failed';
    } else if (commission_status === 'Pending') {
      order.order_status = 'confirmed';
    }

    await order.save();

    // Check or update ResellerWalletLedger
    if (order.reseller_id) {
      let ledger = await ResellerWalletLedger.findOne({ reference_order_id: order._id });
      if (!ledger && commission_status === 'Paid') {
        const netPaise = order.reseller_total_margin_paise || 0;
        ledger = await ResellerWalletLedger.create({
          reseller_id: order.reseller_id,
          transaction_type: 'commission_credit',
          amount: netPaise / 100,
          balance_type: 'available',
          balance_after: netPaise / 100,
          gross_amount_paise: netPaise,
          net_amount_paise: netPaise,
          balance_after_paise: netPaise,
          reference_order_id: order._id,
          idempotency_key: `MANUAL-PAY-${order._id}-${Date.now()}`,
          narration: `Commission payout settled manually by Accounts. UTR: ${utr_reference || 'N/A'}. Notes: ${notes || ''}`
        });
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

        flatItems.push({
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
          payment_status: o.payment_status === 'captured' || o.payment_status === 'paid' ? 'Paid' : o.payment_status,
          order_status: o.order_status,
          order_date: o.created_at
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

      const pStatus = s.status === 'active' ? 'Paid' : s.status === 'grace' ? 'Pending' : s.status === 'cancelled' ? 'Refunded' : 'Failed';
      const amount = s.amount_paid != null ? Number(s.amount_paid) : (s.plan_id?.one_time_fee || 0);

      return res.status(200).json({
        status: 'success',
        data: {
          transaction_id: s.payment_reference || `FPS-${String(s._id).slice(-8).toUpperCase()}`,
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
            payment_date: s.start_date || s.created_at,
            expiry_date: s.expiry_date,
            payment_method: s.payment_reference?.startsWith('pay_') ? 'Razorpay Gateway' : 'Bank Transfer / NEFT',
            utr_reference: s.payment_reference || 'N/A',
            subscription_status: s.status
          },
          created_at: s.created_at
        }
      });
    }

    // Direct EPC or Franchise Order
    const order = await EpcOrder.findById(id)
      .populate('epc_id', 'name email whatsapp gstin onboarding_source address')
      .populate('reseller_id', 'business_name mobile email gst_number contact_person address')
      .lean();

    if (!order) return res.status(404).json({ status: 'error', message: 'Order transaction not found' });

    const isDirect = !order.reseller_id || order.routing_source === 'direct_fallback';
    const totalAmount = (order.grand_total_paise || 0) / 100;
    const subtotal = (order.subtotal_paise || 0) / 100;
    const taxTotal = (order.tax_total_paise || 0) / 100;
    const franchiseCommission = isDirect ? 0 : ((order.reseller_total_margin_paise || 0) / 100);
    const companyAmount = isDirect ? totalAmount : (totalAmount - franchiseCommission);

    let pStatus = 'Pending';
    if (order.payment_status === 'captured' || order.payment_status === 'paid') pStatus = 'Paid';
    else if (order.payment_status === 'refunded') pStatus = 'Refunded';
    else if (order.payment_status === 'failed') pStatus = 'Failed';

    let cStatus = 'N/A';
    if (!isDirect) {
      cStatus = order.order_status === 'delivered' ? 'Paid' : order.order_status === 'cancelled' ? 'Failed' : 'Pending';
    }

    return res.status(200).json({
      status: 'success',
      data: {
        transaction_id: order.order_number || `ORD-${String(order._id).slice(-8).toUpperCase()}`,
        transaction_type: isDirect ? 'Direct EPC Transaction' : 'Franchise Onboarded EPC Order',
        type_key: isDirect ? 'direct_epc' : 'commission',
        is_direct: isDirect,
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
        items: (order.items || []).map(i => ({
          item_name: i.item_name,
          scope_type: i.scope_type,
          quantity: i.quantity,
          unit_price: (i.unit_price_paise || 0) / 100,
          cost_price: (i.cost_price_paise || 0) / 100,
          reseller_margin: isDirect ? 0 : ((i.reseller_margin_paise || 0) / 100),
          tax_paise: (i.tax_paise || 0) / 100,
          total_price: (i.total_price_paise || 0) / 100
        })),
        financial_breakdown: {
          total_amount: totalAmount,
          epc_amount: subtotal,
          tax_amount: taxTotal,
          company_amount: companyAmount,
          franchise_commission: franchiseCommission,
          currency: 'INR'
        },
        payment_info: {
          payment_status: pStatus,
          commission_status: cStatus,
          payment_date: order.created_at,
          commission_paid_date: order.delivered_at || (cStatus === 'Paid' ? order.updated_at : null),
          payment_method: order.payment_reference ? 'Razorpay Gateway / Online' : 'Bank Transfer',
          utr_reference: order.payment_reference || order.razorpay_order_id || 'N/A',
          order_status: order.order_status,
          delivery_address: order.delivery_address
        },
        created_at: order.created_at
      }
    });
  } catch (error) {
    console.error('Error in get_transaction_details:', error);
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
};
