/**
 * reseller.wallet.portal.handler.js
 *
 * Reseller Portal handler for Wallet balance, Ledger history, and Payout requests.
 * Phase 7 — Reseller Management System
 *
 * Pattern: { status: "success"|"error", data, message }
 */

const {
  ResellerWallet,
  ResellerWalletLedger,
  ResellerPayoutRequest,
} = require('../models/india_solarshop_db');
const { getOrCreateResellerWallet, createPayoutRequest } = require('../utils/wallet.ledger.service');

// ─── 1. GET MY WALLET ─────────────────────────────────────────────────────────
/**
 * GET /api/india/v1/reseller/wallet/me
 */
const get_my_wallet = async (req, res) => {
  try {
    const wallet = await getOrCreateResellerWallet(req.reseller._id);
    return res.json({ status: 'success', data: wallet });
  } catch (error) {
    console.error('[reseller.wallet.portal] get_my_wallet error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 2. GET MY LEDGER HISTORY ─────────────────────────────────────────────────
/**
 * GET /api/india/v1/reseller/wallet/ledger
 */
const get_my_ledger = async (req, res) => {
  try {
    const rows = await ResellerWalletLedger.find({ reseller_id: req.reseller._id })
      .sort({ created_at: -1 })
      .lean();

    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('[reseller.wallet.portal] get_my_ledger error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 3. REQUEST WITHDRAWAL ────────────────────────────────────────────────────
/**
 * POST /api/india/v1/reseller/wallet/withdraw
 * Body: { amount, bank_name, account_number, ifsc_code, account_holder_name }
 */
const request_withdrawal = async (req, res) => {
  try {
    const resellerId = req.reseller._id;
    const { amount, bank_name, account_number, ifsc_code, account_holder_name } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ status: 'error', message: 'Valid withdrawal amount is required' });
    }
    if (!bank_name || !account_number || !ifsc_code || !account_holder_name) {
      return res.status(400).json({ status: 'error', message: 'Complete bank account details required' });
    }

    const bankDetails = {
      bank_name:           bank_name.trim(),
      account_number:      account_number.trim(),
      ifsc_code:           ifsc_code.trim().toUpperCase(),
      account_holder_name: account_holder_name.trim(),
    };

    const result = await createPayoutRequest({
      resellerId,
      amount: Number(amount),
      bankDetails,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Payout withdrawal request submitted successfully! Funds held in pending.',
      data: result.payout,
    });
  } catch (error) {
    console.error('[reseller.wallet.portal] request_withdrawal error:', error.message);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// ─── 4. GET MY PAYOUT REQUESTS ────────────────────────────────────────────────
/**
 * GET /api/india/v1/reseller/wallet/payouts
 */
const get_my_payouts = async (req, res) => {
  try {
    const rows = await ResellerPayoutRequest.find({ reseller_id: req.reseller._id })
      .sort({ created_at: -1 })
      .lean();

    return res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('[reseller.wallet.portal] get_my_payouts error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  get_my_wallet,
  get_my_ledger,
  request_withdrawal,
  get_my_payouts,
};
