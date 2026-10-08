/**
 * po.penalty.service.js
 *
 * Core business engine for Purchase Order (PO):
 * - Expiry detection & processing
 * - Admin-configured penalty calculations by kit type & committed quantity
 * - Net refundable token balance settlement
 * - Automated transition to EXPIRED with audit trail
 */

const mongoose = require('mongoose');
const { FpoOrder, PoRefundRequest } = require('../models/india_solarshop_db');
const { logAudit } = require('../utils/audit.service');

/**
 * Calculate penalty and refundable token amount for a PO.
 */
function calculatePoPenalty({
  committedQty = 0,
  purchasedQty = 0,
  tokenPaidPaise = 0,
  tokenAdjustedPaise = 0,
  unitPricePaise = 0,
  penaltyRuleSnapshot = null,
}) {
  const unpurchasedQty = Math.max(0, Number(committedQty || 0) - Number(purchasedQty || 0));
  const remainingTokenPaise = Math.max(0, Number(tokenPaidPaise || 0) - Number(tokenAdjustedPaise || 0));

  if (unpurchasedQty === 0) {
    return {
      unpurchasedQty: 0,
      penaltyPaise: 0,
      refundablePaise: remainingTokenPaise,
      penaltyReason: '100% Commitment fulfilled. No penalty applicable.',
      ruleApplied: 'FULL_COMPLETION',
    };
  }

  // Determine active rule
  let penaltyType = penaltyRuleSnapshot?.default_penalty_type || penaltyRuleSnapshot?.penalty_type || 'FLAT_PER_UNPURCHASED_KIT';
  let penaltyRate = Number(penaltyRuleSnapshot?.default_penalty_rate ?? penaltyRuleSnapshot?.penalty_rate ?? 500);
  let maxCapPaise = Number(penaltyRuleSnapshot?.max_penalty_cap_paise || 0);

  // Check matching tier from penalty_rules array if configured
  if (Array.isArray(penaltyRuleSnapshot?.penalty_rules) && penaltyRuleSnapshot.penalty_rules.length > 0) {
    const matchedRule = penaltyRuleSnapshot.penalty_rules.find((r) => {
      const minOk = r.min_committed_qty == null || committedQty >= r.min_committed_qty;
      const maxOk = r.max_committed_qty == null || committedQty <= r.max_committed_qty;
      return minOk && maxOk;
    });

    if (matchedRule) {
      penaltyType = matchedRule.penalty_type || penaltyType;
      penaltyRate = Number(matchedRule.penalty_rate ?? penaltyRate);
      maxCapPaise = Number(matchedRule.max_penalty_cap_paise || maxCapPaise);
    }
  }

  let calculatedPenaltyPaise = 0;
  let penaltyReason = '';

  if (penaltyType === 'FLAT_PER_UNPURCHASED_KIT') {
    // E.g. ₹500 per unpurchased kit
    const rateInPaise = Math.round(penaltyRate * 100);
    calculatedPenaltyPaise = unpurchasedQty * rateInPaise;
    penaltyReason = `₹${penaltyRate.toLocaleString('en-IN')} penalty applied for ${unpurchasedQty} unpurchased kits.`;
  } else if (penaltyType === 'PERCENTAGE_OF_TOKEN') {
    // E.g. 20% of total token paid
    calculatedPenaltyPaise = Math.round(Number(tokenPaidPaise) * (penaltyRate / 100));
    penaltyReason = `${penaltyRate}% penalty on token deposit applied for unfulfilled quota (${unpurchasedQty} kits).`;
  } else if (penaltyType === 'PERCENTAGE_OF_UNPURCHASED_VALUE') {
    // E.g. 2% of total unpurchased order value
    const unpurchasedValuePaise = unpurchasedQty * Number(unitPricePaise || 4500000);
    calculatedPenaltyPaise = Math.round(unpurchasedValuePaise * (penaltyRate / 100));
    penaltyReason = `${penaltyRate}% penalty on unpurchased order value (${unpurchasedQty} kits).`;
  } else {
    // Default fallback: ₹500 per kit
    calculatedPenaltyPaise = unpurchasedQty * 50000;
    penaltyReason = `Standard ₹500 per unpurchased kit penalty for ${unpurchasedQty} kits.`;
  }

  // Cap with max_penalty_cap_paise if specified
  if (maxCapPaise > 0 && calculatedPenaltyPaise > maxCapPaise) {
    calculatedPenaltyPaise = maxCapPaise;
    penaltyReason += ` (Capped at maximum penalty ₹${(maxCapPaise / 100).toLocaleString('en-IN')})`;
  }

  // Penalty cannot exceed remaining available token
  if (calculatedPenaltyPaise > remainingTokenPaise) {
    calculatedPenaltyPaise = remainingTokenPaise;
    penaltyReason += ` (Capped at total available token balance)`;
  }

  const refundablePaise = Math.max(0, remainingTokenPaise - calculatedPenaltyPaise);

  return {
    unpurchasedQty,
    penaltyPaise: calculatedPenaltyPaise,
    refundablePaise,
    penaltyReason,
    ruleApplied: penaltyType,
  };
}

/**
 * Automatically or manually settle an expired PO:
 * - Computes penalty and refundable token
 * - Marks status = 'EXPIRED'
 * - settlement_status = 'EXPIRED_PENDING_SETTLEMENT'
 */
async function settleExpiredPo(poId, { actor_id = null, actor_type = 'system', note = null, req = null } = {}) {
  const po = await FpoOrder.findById(poId);
  if (!po) throw new Error(`PO Order "${poId}" not found`);

  if (po.status === 'CANCELLED' || po.status === 'REJECTED') {
    throw new Error(`Cannot settle PO in status "${po.status}"`);
  }

  const committedQty = Number(po.total_booked_quantity || po.total_quantity || po.items?.[0]?.quantity || 0);
  const purchasedQty = Number(po.fulfilled_quantity || 0);
  const tokenPaidPaise = Number(po.token_paid_paise || po.token_amount_paise || 0);
  const tokenAdjustedPaise = Number(po.token_adjusted_total_paise || 0);
  const unitPricePaise = Number(po.items?.[0]?.unit_price_paise || 4500000);

  const penaltyResult = calculatePoPenalty({
    committedQty,
    purchasedQty,
    tokenPaidPaise,
    tokenAdjustedPaise,
    unitPricePaise,
    penaltyRuleSnapshot: po.penalty_rule_snapshot || po.po_settings_snapshot,
  });

  const now = new Date();
  po.status = 'EXPIRED';
  po.settlement_status = penaltyResult.refundablePaise > 0 ? 'EXPIRED_PENDING_SETTLEMENT' : 'SETTLED';
  po.unpurchased_quantity = penaltyResult.unpurchasedQty;
  po.applicable_penalty_paise = penaltyResult.penaltyPaise;
  po.refundable_token_paise = penaltyResult.refundablePaise;
  po.token_balance_paise = penaltyResult.refundablePaise;

  po.status_history.push({
    status: 'EXPIRED',
    changed_by: actor_id && mongoose.Types.ObjectId.isValid(actor_id) ? actor_id : null,
    actor_type,
    note: note || `PO Expired. Unpurchased: ${penaltyResult.unpurchasedQty} kits. Penalty: ₹${(penaltyResult.penaltyPaise / 100).toLocaleString('en-IN')}. Refundable: ₹${(penaltyResult.refundablePaise / 100).toLocaleString('en-IN')}`,
    changed_at: now,
  });

  await po.save();

  await logAudit({
    actor_type,
    actor_id,
    action: 'PO_EXPIRED_SETTLED',
    entity_type: 'fpo_orders',
    entity_id: po._id,
    after_snapshot: {
      status: po.status,
      settlement_status: po.settlement_status,
      unpurchased_quantity: po.unpurchased_quantity,
      applicable_penalty_paise: po.applicable_penalty_paise,
      refundable_token_paise: po.refundable_token_paise,
    },
    req,
  });

  return {
    success: true,
    po,
    penaltyResult,
  };
}

/**
 * Scan database for expired POs that have passed lock_expires_at or expires_at
 * and auto-transition them.
 */
async function processDailyExpiredPos() {
  const now = new Date();

  const expiredCandidates = await FpoOrder.find({
    order_type: { $in: ['po_order', 'bulk_po'] },
    status: { $nin: ['EXPIRED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'DRAFT'] },
    $or: [
      { lock_expires_at: { $lte: now } },
      { expires_at: { $lte: now } },
    ],
    settlement_status: { $in: ['ACTIVE', null] },
    deleted_at: null,
  });

  const results = [];
  for (const po of expiredCandidates) {
    try {
      const res = await settleExpiredPo(po._id, {
        actor_id: null,
        actor_type: 'system',
        note: 'Automated Daily Expiry & Penalty Settlement Engine',
      });
      results.push({ po_id: po._id, po_number: po.po_number, success: true, res });
    } catch (err) {
      console.error(`[po.penalty.service] Failed settling PO ${po.po_number}:`, err);
      results.push({ po_id: po._id, po_number: po.po_number, success: false, error: err.message });
    }
  }

  return {
    scanned: expiredCandidates.length,
    processed: results.filter((r) => r.success).length,
    results,
  };
}

module.exports = {
  calculatePoPenalty,
  settleExpiredPo,
  processDailyExpiredPos,
};
