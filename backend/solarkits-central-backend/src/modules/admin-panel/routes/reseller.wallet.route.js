/**
 * reseller.wallet.route.js
 *
 * Admin routes for Commission Engine & Wallet Ledger System.
 * Unique permission code: RSL_WALLET
 * Prefix: /admin-api/reseller-mgmt/wallet
 *
 * Phase 7 — Reseller Management System
 */

const express = require('express');
const router = express.Router();

const check_auth = require('../middlewares/check.auth');
const check_permissions = require('../middlewares/check.permissions');
const handler = require('../controller/reseller.wallet.admin.handler');

router.get(
  '/list',
  check_auth,
  check_permissions([{ unique_code: 'RSL_WALLET', permissions: ['view'] }]),
  handler.list_reseller_wallets
);

router.get(
  '/payouts',
  check_auth,
  check_permissions([{ unique_code: 'RSL_WALLET', permissions: ['view'] }]),
  handler.list_payout_requests
);

router.put(
  '/payouts/process/:id',
  check_auth,
  check_permissions([{ unique_code: 'RSL_WALLET', permissions: ['edit'] }]),
  handler.process_payout_request
);

router.get(
  '/ledger/:reseller_id',
  check_auth,
  check_permissions([{ unique_code: 'RSL_WALLET', permissions: ['view'] }]),
  handler.get_reseller_ledger_history
);

router.post(
  '/settle-commission',
  check_auth,
  check_permissions([{ unique_code: 'RSL_COMM_SETTLE', permissions: ['add', 'edit'] }, { unique_code: 'RSL_WALLET', permissions: ['edit'] }]),
  handler.settle_commission_manual
);

module.exports = router;
