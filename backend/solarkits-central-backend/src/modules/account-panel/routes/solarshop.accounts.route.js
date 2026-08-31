const express = require('express');
const router = express.Router();

const check_auth = require('../middlewares/check.auth');
const solarshop_handler = require('../controller/solarshop.accounts.handler');

// 1. Dashboard summary cards stats
router.get('/dashboard-stats', check_auth, solarshop_handler.get_dashboard_stats);

// 2. Dashboard recent transactions
router.get('/recent-transactions', check_auth, solarshop_handler.get_recent_transactions);

// 3. Franchise Plan Purchases (Page 1)
router.get('/franchise-plans', check_auth, solarshop_handler.get_franchise_plan_purchases);
router.post('/franchise-plans/:id/status', check_auth, solarshop_handler.update_plan_payment_status);

// 4. Direct EPC Transactions (Page 2)
router.get('/direct-epc-transactions', check_auth, solarshop_handler.get_direct_epc_transactions);

// 5. Franchise Commission Tracking (Page 3)
router.get('/franchise-commissions', check_auth, solarshop_handler.get_franchise_commissions);
router.post('/franchise-commissions/:id/status', check_auth, solarshop_handler.update_commission_status);

// 6. Onboarded EPC Purchases & Analytics
router.get('/onboarded-epc-purchases', check_auth, solarshop_handler.get_onboarded_epc_purchases);

// 7. Transaction Details for Side Drawer / Modal
router.get('/transaction-details/:type/:id', check_auth, solarshop_handler.get_transaction_details);

// 8. EPC Offline Payment Verification (Approve / Reject) & Logistics
router.post('/epc-orders/:id/verify-payment', check_auth, solarshop_handler.verify_epc_order_payment);
router.post('/epc-orders/:id/dispatch', check_auth, solarshop_handler.dispatch_epc_order);
router.post('/epc-orders/:id/deliver', check_auth, solarshop_handler.deliver_epc_order);

module.exports = router;
