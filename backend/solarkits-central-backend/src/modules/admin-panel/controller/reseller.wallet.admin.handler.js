/**
 * reseller.wallet.admin.handler.js
 *
 * Admin controller for Reseller Wallet Settlement, Ledger Audit & Payout Reviews.
 * Phase R9 — Reseller Management System
 *
 * Pattern: { status: "success"|"error", data, message }
 */

const mongoose = require('mongoose');
const { ResellerWallet, ResellerWalletLedger, ResellerPayoutRequest } = require('../models/india_solarshop_db');
const { settleOrderCommission } = require('../services/reseller.commission.service');
const { logAudit } = require('../utils/audit.service');

// ─── 1. LIST RESELLER WALLETS ─────────────────────────────────────────────────
/**
 * GET /admin-api/reseller-mgmt/wallet/list
 */
const list_reseller_wallets = async (req, res) => {
  try {
    const filter = {};
    if (req.query.reseller_id && mongoose.Types.ObjectId.isValid(req.query.reseller_id)) {
      filter.reseller_id = req.query.reseller_id;
    }

    const wallets = await ResellerWallet.find(filter)
      .populate('reseller_id', 'business_name email mobile commercial_mode')
      .sort({ updated_at: -1 })
      .lean();

    return res.json({ status: 'success', data: wallets });
  } catch (error) {
    console.error('[reseller.wallet.admin] list_reseller_wallets error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 2. LIST PAYOUT REQUESTS ──────────────────────────────────────────────────
/**
 * GET /admin-api/reseller-mgmt/wallet/payouts
 */
const list_payout_requests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.reseller_id && mongoose.Types.ObjectId.isValid(req.query.reseller_id)) {
      filter.reseller_id = req.query.reseller_id;
    }

    const payouts = await ResellerPayoutRequest.find(filter)
      .populate('reseller_id', 'business_name email mobile')
      .sort({ created_at: -1 })
      .lean();

    return res.json({ status: 'success', data: payouts });
  } catch (error) {
    console.error('[reseller.wallet.admin] list_payout_requests error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 3. SETTLE COMMISSION MANUALLY (Admin) ────────────────────────────────────
/**
 * POST /admin-api/reseller-mgmt/wallet/settle-commission
 * Body: { order_id, order_type ("epc_order"|"purchase_order") }
 */
const settle_commission_manual = async (req, res) => {
  try {
    const { order_id, order_type } = req.body;
    if (!order_id || !mongoose.Types.ObjectId.isValid(order_id)) {
      return res.status(400).json({ status: 'error', message: 'Valid order_id is required' });
    }

    const result = await settleOrderCommission({
      order_id,
      order_type: order_type || 'epc_order',
      actor_id: req.user?.id || null,
      req,
    });

    return res.json({
      status: 'success',
      message: result.already_settled
        ? `Commission for order ${result.order_number || order_id} was already settled`
        : `Commission settled successfully for order ${result.order_number}`,
      data: result,
    });
  } catch (error) {
    console.error('[reseller.wallet.admin] settle_commission_manual error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

// ─── 4. LIST WALLET LEDGERS (Admin) ───────────────────────────────────────────
/**
 * GET /admin-api/reseller-mgmt/wallet/ledgers OR /ledger/:reseller_id
 */
const list_wallet_ledgers = async (req, res) => {
  try {
    const filter = {};
    const targetResellerId = req.params.reseller_id || req.query.reseller_id;
    if (targetResellerId && mongoose.Types.ObjectId.isValid(targetResellerId)) {
      filter.reseller_id = targetResellerId;
    }
    if (req.query.transaction_type) {
      filter.transaction_type = req.query.transaction_type;
    }

    const ledgers = await ResellerWalletLedger.find(filter)
      .populate('reseller_id', 'business_name email mobile')
      .sort({ created_at: -1 })
      .lean();

    return res.json({ status: 'success', data: ledgers });
  } catch (error) {
    console.error('[reseller.wallet.admin] list_wallet_ledgers error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 5. REVIEW PAYOUT REQUEST (Admin Approve / Reject) ──────────────────────
/**
 * PUT /admin-api/reseller-mgmt/wallet/payout-review/:id OR /payouts/process/:id
 * Body: { decision: "approved"|"rejected", review_note?: string }
 */
const review_payout_request = async (req, res) => {
  try {
    const { id } = req.params;
    const decision = req.body.decision || (req.body.status === 'processed' ? 'approved' : req.body.status);
    const review_note = req.body.review_note || req.body.notes;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 'error', message: 'Valid payout request ID is required' });
    }
    if (!decision || !['approved', 'rejected', 'processed'].includes(decision)) {
      return res.status(400).json({ status: 'error', message: 'decision must be approved or rejected' });
    }

    const targetDecision = decision === 'processed' ? 'approved' : decision;

    const payout = await ResellerPayoutRequest.findById(id);
    if (!payout) return res.status(404).json({ status: 'error', message: 'Payout request not found' });
    if (payout.status !== 'pending') {
      return res.status(400).json({ status: 'error', message: `Payout request is already ${payout.status}` });
    }

    const wallet = await ResellerWallet.findOne({ reseller_id: payout.reseller_id });
    if (!wallet) return res.status(404).json({ status: 'error', message: 'Reseller wallet not found' });

    payout.status = targetDecision;
    payout.processed_by = req.user?.id || null;
    payout.processed_at = new Date();
    if (review_note) payout.notes = review_note.trim();
    await payout.save();

    if (targetDecision === 'approved') {
      wallet.pending_balance = Math.max(0, wallet.pending_balance - payout.amount);
      wallet.total_withdrawn = wallet.total_withdrawn + payout.amount;
      if (wallet.pending_balance_paise) wallet.pending_balance_paise = Math.max(0, wallet.pending_balance_paise - Math.round(payout.amount * 100));
      if (wallet.total_withdrawn_paise) wallet.total_withdrawn_paise = wallet.total_withdrawn_paise + Math.round(payout.amount * 100);
      await wallet.save();

      await ResellerWalletLedger.create({
        reseller_id: payout.reseller_id,
        transaction_type: 'payout_debit',
        amount: -payout.amount,
        balance_type: 'pending',
        balance_after: wallet.available_balance,
        reference_payout_id: payout._id,
        idempotency_key: `PAYOUT-DEBIT-${payout._id}`,
        narration: `Payout approved by admin. Reference: ${payout.payout_reference || payout._id}`,
        created_by: req.user?.id || null,
      });
    } else if (targetDecision === 'rejected') {
      wallet.pending_balance = Math.max(0, wallet.pending_balance - payout.amount);
      wallet.available_balance = wallet.available_balance + payout.amount;
      if (wallet.pending_balance_paise) wallet.pending_balance_paise = Math.max(0, wallet.pending_balance_paise - Math.round(payout.amount * 100));
      if (wallet.available_balance_paise) wallet.available_balance_paise = wallet.available_balance_paise + Math.round(payout.amount * 100);
      await wallet.save();

      await ResellerWalletLedger.create({
        reseller_id: payout.reseller_id,
        transaction_type: 'payout_reversal',
        amount: payout.amount,
        balance_type: 'available',
        balance_after: wallet.available_balance,
        reference_payout_id: payout._id,
        idempotency_key: `PAYOUT-REVERSAL-${payout._id}`,
        narration: `Payout rejected by admin (${review_note || 'No reason provided'}). Funds reverted to available balance.`,
        created_by: req.user?.id || null,
      });
    }

    await logAudit({
      actor_type: 'cms_user',
      actor_id: req.user?.id,
      action: targetDecision === 'approved' ? 'PAYOUT_APPROVE' : 'PAYOUT_REJECT',
      entity_type: 'reseller_payout_requests',
      entity_id: payout._id,
      after_snapshot: { status: targetDecision, notes: review_note },
      req,
    });

    return res.json({
      status: 'success',
      message: `Payout request ${targetDecision} successfully`,
      data: payout,
    });
  } catch (error) {
    console.error('[reseller.wallet.admin] review_payout_request error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  list_reseller_wallets,
  list_payout_requests,
  settle_commission_manual,
  list_wallet_ledgers,
  review_payout_request,
  process_payout_request: review_payout_request,
  get_reseller_ledger_history: list_wallet_ledgers,
};
