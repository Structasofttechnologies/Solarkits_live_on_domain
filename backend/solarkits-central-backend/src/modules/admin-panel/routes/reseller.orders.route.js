/**
 * reseller.orders.route.js
 *
 * Admin routes for Reseller Orders tracking (Commission & Dealer mode orders).
 * Unique permission code: RSL_MGMT
 * Prefix: /admin-api/reseller-mgmt/orders
 *
 * Phase 6 — Reseller Management System
 */

const express = require('express');
const router = express.Router();

const check_auth = require('../middlewares/check.auth');
const check_permissions = require('../middlewares/check.permissions');
const handler = require('../controller/reseller.checkout.handler');

router.get(
  '/list',
  check_auth,
  check_permissions([{ unique_code: 'RSL_MGMT', permissions: ['view'] }]),
  handler.list_reseller_orders
);

module.exports = router;
