/**
 * reseller.wallet.admin.handler.js
 *
 * Admin controller for Commission Engine & Wallet Ledger System.
 * Phase 7 — Reseller Management System
 *
 * Pattern: { status: "success"|"error", data, message }
 */

const mongoose = require('mongoose');
const {
  ResellerWallet,
  ResellerWalletLedger,
  ResellerPayoutRequest,
} = require('../models/india_solarshop_db');
const { processPayoutDecision } = require('../utils/wallet.ledger.service');

// ─── 1. LIST RESELLER WALLETS ─────────────────────────────────────────────────
/**
 * GET /admin-api/reseller-mgmt/wallet/list
 */
const list_reseller_wallets = async (req, res) => {
  try {
    const wallets = await ResellerWallet.find({})
      .populate('reseller_id', 'business_name email mobile gst_number commercial_mode activation_status')
      .sort({ available_balance: -1 })
      .lean();

    const data = wallets.map((w) => ({
      id:                w._id,
      reseller:          w.reseller_id,
      available_balance: w.available_balance,
      pending_balance:   w.pending_balance,
      total_earned:      w.total_earned,
      total_withdrawn:   w.total_withdrawn,
      currency:          w.currency,
      status:            w.status,
      updated_at:        w.updated_at,
    }));

    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('[reseller.wallet.admin] list_reseller_wallets error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 2. LIST PAYOUT REQUESTS ──────────────────────────────────────────────────
/**
 * GET /admin-api/reseller-mgmt/wallet/payouts
 * Query: ?status=pending|paid|rejected
 */
const list_payout_requests = async (req, res) => {
  try {
    const { status, reseller_id } = req.query;
    const query = {};

    if (status) query.status = status;
    if (reseller_id && mongoose.Types.ObjectId.isValid(reseller_id)) {
      query.reseller_id = reseller_id;
    }

    const rows = await ResellerPayoutRequest.find(query)
      .populate('reseller_id', 'business_name email mobile gst_number commercial_mode')
      .populate('processed_by', 'name email')
      .sort({ created_at: -1 })
      .lean();

    const data = rows.map((p) => ({
      id:                    p._id,
      reseller:              p.reseller_id,
      amount:                p.amount,
      bank_details:          p.bank_details_snapshot,
      status:                p.status,
      transaction_reference: p.transaction_reference,
      processed_by:          p.processed_by,
      rejection_reason:      p.rejection_reason,
      payout_date:           p.payout_date,
      created_at:            p.created_at,
    }));

    return res.json({ status: 'success', data });
  } catch (error) {
    console.error('[reseller.wallet.admin] list_payout_requests error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 3. PROCESS PAYOUT DECISION ───────────────────────────────────────────────
/**
 * PUT /admin-api/reseller-mgmt/wallet/payouts/process/:id
 * Body: { decision: "paid"|"rejected", transaction_reference?, rejection_reason? }
 */
const process_payout_request = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, transaction_reference, rejection_reason } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid payout request ID required' });
    }

    const result = await processPayoutDecision({
      payoutRequestId:      id,
      adminUserId:          req.user?.id,
      decision,
      transactionReference: transaction_reference,
      rejectionReason:      rejection_reason,
    });

    return res.json({
      status: 'success',
      message: `Payout request processed as ${result.payout.status}`,
      data: result,
    });
  } catch (error) {
    console.error('[reseller.wallet.admin] process_payout_request error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ─── 4. GET RESELLER LEDGER HISTORY ───────────────────────────────────────────
/**
 * GET /admin-api/reseller-mgmt/wallet/ledger/:reseller_id
 */
const get_reseller_ledger_history = async (req, res) => {
  try {
    const { reseller_id } = req.params;
    if (!reseller_id || !mongoose.Types.ObjectId.isValid(reseller_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid reseller_id required' });
    }

    const rows = await ResellerWalletLedger.find({ reseller_id })
      .populate('reference_order_id', '_id status selling_price_snapshot')
      .populate('reference_payout_id', '_id status amount')
      .sort({ created_at: -1 })
      .lean();

    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('[reseller.wallet.admin] get_reseller_ledger_history error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  list_reseller_wallets,
  list_payout_requests,
  process_payout_request,
  get_reseller_ledger_history,
};
