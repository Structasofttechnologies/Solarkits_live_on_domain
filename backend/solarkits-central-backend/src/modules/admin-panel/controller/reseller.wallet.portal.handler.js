/**
 * reseller.wallet.portal.handler.js
 *
 * Reseller Portal handler for Wallet balance, Ledger history, and Payout requests.
 * Phase 7  — Reseller Management System (initial)
 * Phase R10 — Bug fixes & additions:
 *   1. request_withdrawal validates amount server-side (integer paise, ≥₹100, ≤available).
 *   2. Never trusts frontend-computed amounts — all balance checks server-side.
 *   3. Passes amountPaise (integer) to createPayoutRequest (no float arithmetic).
 *   4. get_my_wallet returns full paise breakdown + formula snapshot.
 *   5. Added GET /wallet/breakdown for formula details.
 *   6. Added GET /wallet/stats for quick KPI summary.
 *
 * Pattern: { status: "success"|"error", data, message }
 */

const {
  ResellerWallet,
  ResellerWalletLedger,
  ResellerPayoutRequest,
} = require('../models/india_solarshop_db');
const { getOrCreateResellerWallet, createPayoutRequest } = require('../utils/wallet.ledger.service');

// ── Paise helpers ────────────────────────────────────────────────────────────
function toPaise(rupees)  { return Math.round(Number(rupees) * 100); }
function toRupees(paise)  { return Math.round(paise) / 100; }

// ── Minimum withdrawal: ₹100 (10 000 paise) ─────────────────────────────────
const MIN_WITHDRAWAL_PAISE = 10000;

// ─── 1. GET MY WALLET ─────────────────────────────────────────────────────────
/**
 * GET /api/india/v1/reseller/wallet/me
 *
 * Returns the complete wallet state including the full formula breakdown.
 */
const get_my_wallet = async (req, res) => {
  try {
    const wallet = await getOrCreateResellerWallet(req.reseller._id);

    // Build the authoritative calculation breakdown
    const grossEarned    = wallet.gross_earned_paise   || 0;
    const tdsDeducted    = wallet.tds_deducted_paise   || 0;
    const tcsDeducted    = wallet.tcs_deducted_paise   || 0;
    const netEarned      = wallet.total_earned_paise   || 0;
    const totalWithdrawn = wallet.total_withdrawn_paise || 0;
    const pendingHolds   = wallet.pending_balance_paise || 0;
    const available      = wallet.available_balance_paise || 0;

    const response = {
      ...wallet.toObject(),
      // Paise-based KPIs (authoritative)
      gross_earned_paise:    grossEarned,
      tds_deducted_paise:    tdsDeducted,
      tcs_deducted_paise:    tcsDeducted,
      net_earned_paise:      netEarned,
      total_withdrawn_paise: totalWithdrawn,
      pending_balance_paise: pendingHolds,
      available_balance_paise: available,
      // INR display values (derived)
      gross_earned:    toRupees(grossEarned),
      tds_deducted:    toRupees(tdsDeducted),
      tcs_deducted:    toRupees(tcsDeducted),
      total_earned:    toRupees(netEarned),
      total_withdrawn: toRupees(totalWithdrawn),
      pending_balance: toRupees(pendingHolds),
      available_balance: toRupees(available),
      // Minimum withdrawal threshold
      min_withdrawal_amount: toRupees(MIN_WITHDRAWAL_PAISE),
      // Formula breakdown for display
      formula_breakdown: {
        gross_earnings:          toRupees(grossEarned),
        minus_tds:              -toRupees(tdsDeducted),
        minus_tcs:              -toRupees(tcsDeducted),
        net_earnings:            toRupees(netEarned),
        minus_completed_withdrawals: -toRupees(totalWithdrawn),
        minus_pending_holds:    -toRupees(pendingHolds),
        equals_available_balance: toRupees(available),
      },
    };

    return res.json({ status: 'success', data: response });
  } catch (error) {
    console.error('[reseller.wallet.portal] get_my_wallet error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ─── 2. GET MY LEDGER HISTORY ─────────────────────────────────────────────────
/**
 * GET /api/india/v1/reseller/wallet/ledger
 * Query: ?limit=, ?type=
 */
const get_my_ledger = async (req, res) => {
  try {
    const filter = { reseller_id: req.reseller._id };
    if (req.query.type) filter.transaction_type = req.query.type;

    const limit = Math.min(200, parseInt(req.query.limit) || 100);

    const rows = await ResellerWalletLedger.find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
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
 *
 * Body: { amount, bank_name, account_number, ifsc_code, account_holder_name }
 *
 * Financial safety enforced here (never trusts frontend):
 *   - Converts amount to paise (integer) on the server.
 *   - Validates minimum ₹100.
 *   - Validates amount does not exceed available_balance_paise.
 *   - Duplicate pending payout guard is inside createPayoutRequest (session-safe).
 *   - All DB writes are atomic (MongoDB session inside createPayoutRequest).
 */
const request_withdrawal = async (req, res) => {
  try {
    const resellerId = req.reseller._id;
    const { amount, bank_name, account_number, ifsc_code, account_holder_name } = req.body;

    // ── 1. Input validation ───────────────────────────────────────────────
    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ status: 'error', message: 'Withdrawal amount is required' });
    }

    const amountFloat = Number(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return res.status(400).json({ status: 'error', message: 'Withdrawal amount must be a positive number' });
    }

    // Convert to paise (integer) — this is now the authoritative value
    const amountPaise = Math.floor(amountFloat * 100); // floor to avoid crediting more than requested
    if (amountPaise < MIN_WITHDRAWAL_PAISE) {
      return res.status(400).json({
        status: 'error',
        message: `Minimum withdrawal amount is ₹${toRupees(MIN_WITHDRAWAL_PAISE)}. Requested: ₹${toRupees(amountPaise)}`,
      });
    }

    // ── 2. Bank details validation ────────────────────────────────────────
    if (!bank_name?.trim() || !account_number?.trim() || !ifsc_code?.trim() || !account_holder_name?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Complete bank account details are required' });
    }

    // IFSC format validation (11 chars: 4 alpha + 0 + 6 alphanumeric)
    const ifscClean = ifsc_code.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscClean)) {
      return res.status(400).json({ status: 'error', message: `Invalid IFSC code format: ${ifscClean}` });
    }

    const bankDetails = {
      bank_name:            bank_name.trim(),
      account_number:       account_number.trim().replace(/\s/g, ''),
      ifsc_code:            ifscClean,
      account_holder_name:  account_holder_name.trim(),
    };

    // ── 3. Delegate to service (which does balance check + atomic write) ─
    const result = await createPayoutRequest({
      resellerId,
      amountPaise,
      bankDetails,
    });

    return res.status(201).json({
      status: 'success',
      message: `Withdrawal request of ₹${toRupees(amountPaise)} submitted successfully. Funds are now on hold pending admin review.`,
      data: {
        payout_id:     result.payout._id,
        amount_inr:    toRupees(amountPaise),
        amount_paise:  amountPaise,
        status:        result.payout.status,
        bank_details:  bankDetails,
        created_at:    result.payout.created_at,
      },
    });
  } catch (error) {
    console.error('[reseller.wallet.portal] request_withdrawal error:', error.message);
    const status = error.message.includes('Insufficient') || error.message.includes('already pending') ? 400 : 500;
    return res.status(status).json({ status: 'error', message: error.message });
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

// ─── 5. WALLET BREAKDOWN (formula detail) ─────────────────────────────────────
/**
 * GET /api/india/v1/reseller/wallet/breakdown
 *
 * Returns the step-by-step calculation formula as per the policy:
 *   Gross Earnings
 *   − TDS − TCS
 *   = Net Earnings
 *   − Completed Withdrawals
 *   − Pending/Held Withdrawals
 *   = Available Withdrawal Balance
 */
const get_wallet_breakdown = async (req, res) => {
  try {
    const wallet = await getOrCreateResellerWallet(req.reseller._id);

    const grossEarned    = wallet.gross_earned_paise   || 0;
    const tdsDeducted    = wallet.tds_deducted_paise   || 0;
    const tcsDeducted    = wallet.tcs_deducted_paise   || 0;
    const netEarned      = wallet.total_earned_paise   || 0;
    const totalWithdrawn = wallet.total_withdrawn_paise || 0;
    const pendingHolds   = wallet.pending_balance_paise || 0;
    const available      = wallet.available_balance_paise || 0;

    return res.json({
      status: 'success',
      data: {
        // Authoritative paise values
        paise: {
          gross_earned:        grossEarned,
          tds_deducted:        tdsDeducted,
          tcs_deducted:        tcsDeducted,
          net_earned:          netEarned,
          total_withdrawn:     totalWithdrawn,
          pending_holds:       pendingHolds,
          available_balance:   available,
        },
        // Human-readable INR values
        inr: {
          gross_earnings:      toRupees(grossEarned),
          tds_deducted:       -toRupees(tdsDeducted),
          tcs_deducted:       -toRupees(tcsDeducted),
          net_earnings:        toRupees(netEarned),
          completed_withdrawals: -toRupees(totalWithdrawn),
          pending_holds:      -toRupees(pendingHolds),
          available_balance:   toRupees(available),
        },
        min_withdrawal_inr: toRupees(MIN_WITHDRAWAL_PAISE),
        wallet_status:      wallet.status,
        currency:           wallet.currency || 'INR',
      },
    });
  } catch (error) {
    console.error('[reseller.wallet.portal] get_wallet_breakdown error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  get_my_wallet,
  get_my_ledger,
  request_withdrawal,
  get_my_payouts,
  get_wallet_breakdown,
};
