const express = require('express');
const router = express.Router();
const warehouse_handler = require('../controller/warehouse.handler');
const inward_handler = require('../controller/inward.handler');
const vehicle_handler = require('../controller/vehicle.handler');
const check_auth = require('../middlewares/check.auth');
const check_permissions = require('../middlewares/check.permissions');
const { upload_files } = require('../utils/upload.files');

// ─── Permission config shorthand ─────────────────────────────────────────────
const perm = (unique_code, ...actions) => check_permissions([{ unique_code, permissions: actions }]);

// ─── Warehouse Profile & Validation (no module permission required) ──────────
router.get('/validation-sections', check_auth, warehouse_handler.get_validation_sections);
router.get('/profile-completion', check_auth, warehouse_handler.get_profile_completion);
router.get('/validation-fields/:section_id', check_auth, warehouse_handler.get_validation_fields);
router.post('/submit-validation-data', check_auth, warehouse_handler.submit_validation_data);
router.post('/save-validation-data', check_auth, warehouse_handler.save_validation_data);
router.post('/upload-documents', check_auth, upload_files('public/uploads/warehouse_docs', 20, 'documents', 10), warehouse_handler.upload_documents);
router.post('/upload-inward-invoices', check_auth, upload_files('public/uploads/local_inward_invoices', 20, 'documents', 10), warehouse_handler.upload_documents);
router.get('/sales-orders', check_auth, warehouse_handler.get_sales_orders);
router.post('/sales-orders/:id/deliver', check_auth, warehouse_handler.deliver_sales_order);
router.post('/sales-orders/:id/tracking', check_auth, warehouse_handler.update_sales_order_tracking);
router.post('/po-requests', check_auth, warehouse_handler.create_po_request);
router.get('/po-requests', check_auth, warehouse_handler.get_po_requests);

// ─── Material Inward & Stock  (unique_code: "WH_MAT_INWARD") ──────────────────────
router.get('/inward/active-skus', check_auth, perm('WH_MAT_INWARD', 'view'), inward_handler.get_active_skus);
router.post('/inward/save',       check_auth, perm('WH_MAT_INWARD', 'add'),  inward_handler.save_inward);
router.get('/inward/logs',        check_auth, perm('WH_MAT_INWARD', 'view'), inward_handler.get_inward_logs);
router.get('/inward/stock-status',check_auth, perm('WH_MAT_INWARD', 'view'), inward_handler.get_stock_status);
router.get('/inward/purchase-orders', check_auth, perm('WH_MAT_INWARD', 'view'), inward_handler.get_warehouse_purchase_orders);
router.post('/inward/purchase-orders/:id/deliver', check_auth, perm('WH_MAT_INWARD', 'add'), inward_handler.mark_purchase_order_delivered);
router.post('/inward/upload-tax-invoice', check_auth, perm('WH_MAT_INWARD', 'add'), upload_files('public/uploads/tax-invoices', 20, 'file', 1), (req, res) => {
  if (req.files && req.files[0]) {
    return res.status(200).json({ status: "success", url: req.files[0].path });
  }
  return res.status(400).json({ status: "error", message: "No file uploaded." });
});

// ─── Vehicle Management ───
router.get('/vehicles/compare', check_auth, vehicle_handler.compare_vehicles);
router.get('/vehicles', check_auth, vehicle_handler.get_vehicles);
router.post('/vehicles', check_auth, vehicle_handler.add_vehicle);
router.put('/vehicles/:id', check_auth, vehicle_handler.update_vehicle);
router.delete('/vehicles/:id', check_auth, vehicle_handler.delete_vehicle);

// ─── Driver Management ───
router.get('/drivers', check_auth, vehicle_handler.get_drivers);
router.post('/drivers', check_auth, vehicle_handler.add_driver);
router.put('/drivers/:id', check_auth, vehicle_handler.update_driver);
router.delete('/drivers/:id', check_auth, vehicle_handler.delete_driver);

module.exports = router;
