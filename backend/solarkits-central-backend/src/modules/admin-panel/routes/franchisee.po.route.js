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

router.get('/list',              check_auth, check_permissions([{ unique_code: 'FPO_ORDER', permissions: ['view'] }]),   h.list_po_orders);
router.get('/detail/:id',        check_auth, check_permissions([{ unique_code: 'FPO_ORDER', permissions: ['view'] }]),   h.get_po_order);
router.post('/draft',            check_auth, check_permissions([{ unique_code: 'FPO_ORDER', permissions: ['add']  }]),   h.create_draft);
router.post('/submit',           check_auth, check_permissions([{ unique_code: 'FPO_ORDER', permissions: ['edit'] }]),   h.submit_po);
router.put('/approve',           check_auth, check_permissions([{ unique_code: 'FPO_ORDER', permissions: ['edit'] }]),   h.approve_po);
router.put('/reject',            check_auth, check_permissions([{ unique_code: 'FPO_ORDER', permissions: ['edit'] }]),   h.reject_po);
router.post('/confirm-payment',  check_auth, check_permissions([{ unique_code: 'FPO_ORDER', permissions: ['edit'] }]),   h.confirm_payment);
router.put('/dispatch',          check_auth, check_permissions([{ unique_code: 'FPO_ORDER', permissions: ['edit'] }]),   h.dispatch_po);
router.put('/deliver',           check_auth, check_permissions([{ unique_code: 'FPO_ORDER', permissions: ['edit'] }]),   h.deliver_po);
router.put('/cancel',            check_auth, check_permissions([{ unique_code: 'FPO_ORDER', permissions: ['edit'] }]),   h.cancel_po);
router.post('/return',           check_auth, check_permissions([{ unique_code: 'FPO_ORDER', permissions: ['edit'] }]),   h.process_returns);

module.exports = router;
