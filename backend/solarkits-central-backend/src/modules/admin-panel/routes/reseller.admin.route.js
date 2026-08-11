/**
 * reseller.admin.route.js
 *
 * Admin routes for Reseller Management (Reseller List, Detail, KYC Review, Activation Control).
 * Prefix: /admin-api/reseller-mgmt
 */

const express = require('express');
const router = express.Router();

const check_auth = require('../middlewares/check.auth');
const check_permissions = require('../middlewares/check.permissions');
const handler = require('../controller/reseller.admin.handler');

router.get(
  '/list',
  check_auth,
  check_permissions([
    { unique_code: 'RSL_MGMT', permissions: ['view'] },
    { unique_code: 'RSL_TERRITORY', permissions: ['view'] },
    { unique_code: 'RSL_PRODAUTH', permissions: ['view'] },
    { unique_code: 'RSL_EPC', permissions: ['view'] },
    { unique_code: 'RSL_ORDER', permissions: ['view'] },
    { unique_code: 'RSL_WALLET', permissions: ['view'] },
    { unique_code: 'RSL_PLAN', permissions: ['view'] },
    { unique_code: 'RSL_KYC', permissions: ['view'] },
  ]),
  handler.list_resellers
);

router.get(
  '/detail/:id',
  check_auth,
  check_permissions([{ unique_code: 'RSL_MGMT', permissions: ['view'] }]),
  handler.get_reseller_detail
);

router.put(
  '/kyc/review/:id',
  check_auth,
  check_permissions([{ unique_code: 'RSL_KYC', permissions: ['edit'] }]),
  handler.review_kyc
);

router.put(
  '/activation-status/:id',
  check_auth,
  check_permissions([{ unique_code: 'RSL_MGMT', permissions: ['edit'] }]),
  handler.change_activation_status
);

router.post(
  '/subscription/assign/:id',
  check_auth,
  check_permissions([{ unique_code: 'RSL_PLAN', permissions: ['edit'] }]),
  handler.assign_plan_to_reseller
);

module.exports = router;
