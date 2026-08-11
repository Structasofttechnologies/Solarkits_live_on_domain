/**
 * wallet.ledger.service.js
 *
 * Idempotent Double-Entry Wallet Ledger & Commission Payout Service.
 * Phase 7 — Reseller Management System
 *
 * Financial Integrity Safeguards:
 *   - Idempotency key prevents duplicate commission credits per order.
 *   - Double-entry balance snapshot recorded on every ledger entry.
 *   - Funds held in pending_balance during payout request lifecycle.
 */

const {
  ResellerWallet,
  ResellerWalletLedger,
  ResellerPayoutRequest,
} = require('../models/india_solarshop_db');
const { logAudit } = require('./audit.service');

/**
 * Get or create wallet document for a reseller.
 */
async function getOrCreateResellerWallet(resellerId) {
  let wallet = await ResellerWallet.findOne({ reseller_id: resellerId });
  if (!wallet) {
    wallet = await ResellerWallet.create({ reseller_id: resellerId });
  }
  return wallet;
}

/**
 * Credit earned commission to a reseller's wallet (Idempotent).
 */
async function creditCommissionToWallet({ resellerId, orderId, amount, commissionRate, narration }) {
  if (!resellerId || !orderId || amount <= 0) {
    throw new Error('Valid resellerId, orderId, and positive amount are required');
  }

  const idempotencyKey = `COMMISSION_ORDER_${orderId}`;

  // Idempotency check
  const existingLedger = await ResellerWalletLedger.findOne({ idempotency_key: idempotencyKey });
  if (existingLedger) {
    return { wallet: await ResellerWallet.findOne({ reseller_id: resellerId }), ledger: existingLedger, is_duplicate: true };
  }

  const wallet = await getOrCreateResellerWallet(resellerId);

  const newBalance = wallet.available_balance + amount;
  wallet.available_balance = newBalance;
  wallet.total_earned += amount;
  await wallet.save();

  const ledger = await ResellerWalletLedger.create({
    reseller_id:        resellerId,
    transaction_type:   'commission_credit',
    amount:             amount,
    balance_type:       'available',
    balance_after:      newBalance,
    reference_order_id: orderId,
    idempotency_key:    idempotencyKey,
    narration:          narration || `Commission credit for Purchase Order #${orderId} (${commissionRate}% rate)`,
  });

  return { wallet, ledger, is_duplicate: false };
}

/**
 * Submit a payout withdrawal request (holds funds in pending_balance).
 */
async function createPayoutRequest({ resellerId, amount, bankDetails }) {
  if (!resellerId || !amount || amount <= 0) {
    throw new Error('Valid resellerId and positive amount required');
  }

  const wallet = await getOrCreateResellerWallet(resellerId);
  if (wallet.available_balance < amount) {
    throw new Error(`Insufficient wallet balance. Available: ₹${wallet.available_balance}, Requested: ₹${amount}`);
  }

  // Move funds: available_balance -> pending_balance
  const newAvailable = wallet.available_balance - amount;
  const newPending = wallet.pending_balance + amount;

  wallet.available_balance = newAvailable;
  wallet.pending_balance = newPending;
  await wallet.save();

  const payoutReq = await ResellerPayoutRequest.create({
    reseller_id:           resellerId,
    amount,
    bank_details_snapshot: bankDetails,
    status:                'pending',
  });

  const idempotencyKey = `PAYOUT_REQ_${payoutReq._id}`;

  const ledger = await ResellerWalletLedger.create({
    reseller_id:          resellerId,
    transaction_type:     'payout_hold',
    amount:               -amount,
    balance_type:         'available',
    balance_after:        newAvailable,
    reference_payout_id:  payoutReq._id,
    idempotency_key:      idempotencyKey,
    narration:            `Payout request #${payoutReq._id} placed (funds held in pending)`,
  });

  return { payout: payoutReq, ledger, wallet };
}

/**
 * Process payout approval or rejection (Admin function).
 */
async function processPayoutDecision({ payoutRequestId, adminUserId, decision, transactionReference, rejectionReason }) {
  const payoutReq = await ResellerPayoutRequest.findById(payoutRequestId);
  if (!payoutReq) throw new Error('Payout request not found');
  if (payoutReq.status !== 'pending' && payoutReq.status !== 'processing') {
    throw new Error(`Payout request is already ${payoutReq.status}`);
  }

  const wallet = await getOrCreateResellerWallet(payoutReq.reseller_id);

  if (decision === 'paid' || decision === 'approved') {
    // Complete payout: deduct from pending_balance and add to total_withdrawn
    wallet.pending_balance = Math.max(0, wallet.pending_balance - payoutReq.amount);
    wallet.total_withdrawn += payoutReq.amount;
    await wallet.save();

    payoutReq.status = 'paid';
    payoutReq.transaction_reference = transactionReference || `TXN_${Date.now()}`;
    payoutReq.processed_by = adminUserId;
    payoutReq.payout_date = new Date();
    await payoutReq.save();

    await ResellerWalletLedger.create({
      reseller_id:         payoutReq.reseller_id,
      transaction_type:    'payout_debit',
      amount:              -payoutReq.amount,
      balance_type:        'pending',
      balance_after:       wallet.pending_balance,
      reference_payout_id: payoutReq._id,
      idempotency_key:     `PAYOUT_PAID_${payoutReq._id}`,
      narration:           `Payout #${payoutReq._id} fulfilled. Ref: ${payoutReq.transaction_reference}`,
      created_by:          adminUserId,
    });
  } else if (decision === 'rejected') {
    // Return funds from pending_balance back to available_balance
    wallet.pending_balance = Math.max(0, wallet.pending_balance - payoutReq.amount);
    wallet.available_balance += payoutReq.amount;
    await wallet.save();

    payoutReq.status = 'rejected';
    payoutReq.rejection_reason = rejectionReason || 'Rejected by administrator';
    payoutReq.processed_by = adminUserId;
    await payoutReq.save();

    await ResellerWalletLedger.create({
      reseller_id:         payoutReq.reseller_id,
      transaction_type:    'payout_reversal',
      amount:              payoutReq.amount,
      balance_type:        'available',
      balance_after:       wallet.available_balance,
      reference_payout_id: payoutReq._id,
      idempotency_key:     `PAYOUT_REVERSED_${payoutReq._id}`,
      narration:           `Payout #${payoutReq._id} rejected. Funds returned to available balance. Reason: ${payoutReq.rejection_reason}`,
      created_by:          adminUserId,
    });
  }

  await logAudit({
    actor_type: 'cms_user',
    actor_id: adminUserId,
    action: decision === 'paid' ? 'RESELLER_PAYOUT_FULFILL' : 'RESELLER_PAYOUT_REJECT',
    entity_type: 'reseller_payout_requests',
    entity_id: payoutRequestId,
    after_snapshot: { status: payoutReq.status, amount: payoutReq.amount },
  });

  return { payout: payoutReq, wallet };
}

module.exports = {
  getOrCreateResellerWallet,
  creditCommissionToWallet,
  createPayoutRequest,
  processPayoutDecision,
};
