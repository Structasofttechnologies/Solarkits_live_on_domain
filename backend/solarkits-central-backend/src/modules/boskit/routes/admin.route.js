'use strict';

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin/admin.controller');
const contentController = require('../controllers/cms/content.controller');
const reportsController = require('../controllers/admin/reports.controller');
const auditController = require('../controllers/admin/audit.controller');

// ── Admin Distributor Application Endpoints ─────────────────────────────────
router.get('/stats',                                    adminController.get_admin_stats);
router.get('/distributor-applications',                 adminController.get_distributor_applications);
router.get('/distributor-applications/:id',             adminController.get_distributor_application_detail);
router.post('/distributor-applications/:id/review',     adminController.review_distributor_application);
router.post('/distributor-applications/:id/activate',   adminController.activate_distributor_account);
router.get('/distributors',                             adminController.get_distributors);
router.post('/distributors/:id/status',                 adminController.update_distributor_status);
router.get('/dealers',                                  adminController.get_dealers);

// ── Admin Distributor Plan Management Endpoints ─────────────────────────────
router.get('/plans',                                    adminController.get_plans);
router.post('/plans',                                   adminController.create_plan);
router.put('/plans/reorder',                            adminController.reorder_plans);
router.post('/plans/migrate-distributors',              adminController.migrate_distributors_plan);
router.get('/plans/territory-allocations',              adminController.get_territory_allocations);
router.post('/plans/territory-override',                adminController.override_territory_conflict);
router.put('/plans/:id',                                adminController.update_plan);
router.post('/plans/:id/duplicate',                     adminController.duplicate_plan);
router.patch('/plans/:id/status',                       adminController.set_plan_status);
router.get('/plans/:id/versions',                       adminController.get_plan_versions);

// ── Content Management CMS Endpoints ──────────────────────────────────────────
router.get('/content',                                  contentController.get_admin_content);
router.post('/content',                                 contentController.create_admin_content);
router.put('/content/:id',                              contentController.update_admin_content);
router.delete('/content/:id',                           contentController.delete_admin_content);

// ── Cross-Platform Reports Endpoints ──────────────────────────────────────────
router.get('/reports/executive-summary',                reportsController.get_executive_summary);
router.get('/reports/financials',                       reportsController.get_financial_reports);
router.get('/reports/territory-coverage',               reportsController.get_territory_reports);

// ── Audit Logs Endpoints ──────────────────────────────────────────────────────
router.get('/audit-logs',                               auditController.get_audit_logs);

module.exports = router;
