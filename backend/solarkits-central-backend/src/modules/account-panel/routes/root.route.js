const express = require('express');
const router = express.Router();

const root_handler = require('../controller/root.handler');
const accounts_handler = require('../controller/accounts.handler');
const check_auth = require('../middlewares/check.auth');
const { upload_files } = require('../utils/upload.files');

router.get('/user-data', check_auth, root_handler.get_user_data);
router.get('/user-modules', check_auth, root_handler.get_user_modules);

router.get('/geography/countries', check_auth, root_handler.get_active_countries);
router.get('/geography/states', check_auth, root_handler.get_active_states);
router.get('/geography/states/:country_id', check_auth, root_handler.get_active_states);
router.get('/geography/clusters', check_auth, root_handler.get_active_clusters);
router.get('/geography/clusters/:state_id', check_auth, root_handler.get_active_clusters);
router.get('/geography/assigned-clusters', check_auth, root_handler.get_assigned_clusters);

// Inward Verification & Stock updates
router.get('/accounts/pending-inwards', check_auth, accounts_handler.get_pending_inwards);
router.post('/accounts/inwards/:id/approve', check_auth, accounts_handler.approve_inward);
router.post('/accounts/inwards/:id/reject', check_auth, accounts_handler.reject_inward);
router.get('/accounts/warehouses', check_auth, accounts_handler.get_warehouses);
router.get('/accounts/warehouse-inwards', check_auth, accounts_handler.get_warehouse_inwards);
router.get('/accounts/completed-deliveries', check_auth, accounts_handler.get_completed_deliveries);

// Purchase Orders (POs)
router.get('/accounts/warehouses/:warehouseId/skus', check_auth, accounts_handler.get_warehouse_skus);
router.get('/accounts/warehouses/:warehouseId/skus/:skuId/suppliers', check_auth, accounts_handler.get_sku_suppliers);
router.get('/accounts/warehouses/:warehouseId/suppliers', check_auth, accounts_handler.get_warehouse_suppliers);
router.get('/accounts/warehouses/:warehouseId/suppliers/:supplierId/prices', check_auth, accounts_handler.get_supplier_warehouse_prices);
router.post('/accounts/purchase-orders', check_auth, accounts_handler.create_purchase_order);
router.put('/accounts/purchase-orders/:id/timeline', check_auth, accounts_handler.update_purchase_order_timeline);
router.post('/accounts/purchase-orders/:id/pay', check_auth, accounts_handler.pay_purchase_order);
router.post('/accounts/purchase-orders/:id/cancel', check_auth, accounts_handler.cancel_purchase_order);
router.get('/accounts/combo-kits', check_auth, accounts_handler.get_combo_kits);
router.get('/accounts/countries/:countryId/saas-products', check_auth, accounts_handler.get_country_saas_products);
router.post('/accounts/upload-payment-receipt', check_auth, upload_files('public/uploads/payment-receipts', 10, 'file', 1), (req, res) => {
  if (req.files && req.files[0]) {
    return res.status(200).json({ status: "success", url: req.files[0].path });
  }
  return res.status(400).json({ status: "error", message: "No file uploaded." });
});
router.get('/accounts/purchase-orders', check_auth, accounts_handler.get_purchase_orders);
router.get('/accounts/skus/:skuId/details', check_auth, accounts_handler.get_sku_details);

// PO Requests from Warehouse
router.get('/accounts/po-requests', check_auth, accounts_handler.get_po_requests);
router.post('/accounts/po-requests/:id/status', check_auth, accounts_handler.update_po_request_status);

// Supplier Registration & Listing
router.get('/accounts/suppliers', check_auth, accounts_handler.list_suppliers);
router.post('/accounts/suppliers', check_auth, accounts_handler.create_supplier);
router.post('/accounts/gst/generate-otp', check_auth, accounts_handler.gst_generate_otp);
router.post('/accounts/gst/submit-otp', check_auth, accounts_handler.gst_submit_otp);

// Solar Shop Accounts Financial Management
const solarshop_accounts_route = require('./solarshop.accounts.route');
router.use('/accounts/solar-shop', solarshop_accounts_route);

module.exports = router;
