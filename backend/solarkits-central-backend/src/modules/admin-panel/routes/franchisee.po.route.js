/**
 * franchisee.po.route.js
 * Prefix: /admin-api/franchisee/po
 * Permission code: FPO_ORDER
 */
const express = require('express');
const router  = express.Router();
const check_auth = require('../middlewares/check.auth');
const check_permissions = require('../middlewares/check.permissions');
const h = require('../controller/franchisee.po.handler');

const PERM_VIEW = [{ unique_code: 'FPO_ORDER', permissions: ['view'] }, { unique_code: 'ADM_PO_ORDERS', permissions: ['view'] }, { unique_code: 'RSL_MGMT', permissions: ['view'] }];
const PERM_ADD  = [{ unique_code: 'FPO_ORDER', permissions: ['add'] },  { unique_code: 'ADM_PO_ORDERS', permissions: ['add'] },  { unique_code: 'RSL_MGMT', permissions: ['add'] }];
const PERM_EDIT = [{ unique_code: 'FPO_ORDER', permissions: ['edit'] }, { unique_code: 'ADM_PO_ORDERS', permissions: ['edit'] }, { unique_code: 'RSL_MGMT', permissions: ['edit'] }];

router.get('/list',              check_auth, check_permissions(PERM_VIEW), h.list_po_orders);
router.get('/detail/:id',        check_auth, check_permissions(PERM_VIEW), h.get_po_order);
router.post('/draft',            check_auth, check_permissions(PERM_ADD),  h.create_draft);
router.post('/submit',           check_auth, check_permissions(PERM_EDIT), h.submit_po);
router.put('/approve',           check_auth, check_permissions(PERM_EDIT), h.approve_po);
router.put('/reject',            check_auth, check_permissions(PERM_EDIT), h.reject_po);
router.post('/confirm-payment',  check_auth, check_permissions(PERM_EDIT), h.confirm_payment);
router.put('/dispatch',          check_auth, check_permissions(PERM_EDIT), h.dispatch_po);
router.put('/deliver',           check_auth, check_permissions(PERM_EDIT), h.deliver_po);
router.put('/cancel',            check_auth, check_permissions(PERM_EDIT), h.cancel_po);
router.post('/return',           check_auth, check_permissions(PERM_EDIT), h.process_returns);

module.exports = router;
