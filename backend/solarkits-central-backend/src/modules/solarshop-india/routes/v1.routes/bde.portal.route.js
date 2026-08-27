/**
 * bde.portal.route.js
 *
 * Express router for BDE Portal self-service APIs.
 * Prefix: /api/bde/v1 or /api/india/v1/bde
 *
 * Step 1 — SolarKits BDE System
 */

const express = require('express');
const router = express.Router();

const { verify_bde_auth } = require('../../middlewares/verify_bde_auth');
const handler = require('../../controller/bde.portal.handler');
const employeeHandler = require('../../../admin-panel/controller/store.setup.employee.handler');
const { upload_any_files } = require('../../../admin-panel/utils/upload.files');

const proofUpload = upload_any_files('public/uploads/store_setup', 10);

// ── Public Auth Endpoints ─────────────────────────────────────────────────────
router.post('/auth/login', handler.login_bde);
router.post('/auth/logout', handler.logout_bde);
router.post('/auth/forgot-password', handler.forgot_password);

// ── Protected BDE Endpoints ───────────────────────────────────────────────────
router.post('/auth/change-password', verify_bde_auth, handler.change_password);
router.get('/profile/me', verify_bde_auth, handler.get_bde_me);
router.put('/profile/update', verify_bde_auth, handler.update_me || handler.update_bde_me);
router.get('/dashboard', verify_bde_auth, handler.get_bde_dashboard);

// Notifications
router.get('/notifications', verify_bde_auth, handler.get_notifications);
router.put('/notifications/:id/read', verify_bde_auth, handler.mark_notification_read);

// Scoped assignments & Physical Store Setup Execution
router.get('/territory/my', verify_bde_auth, handler.get_my_territory);
router.get('/territory/availability', verify_bde_auth, require('../../controller/reseller.portal.handler').check_territory_availability);
router.post('/gst/verify', verify_bde_auth, require('../../controller/reseller.portal.handler').verify_gstin);
router.get('/plans/my', verify_bde_auth, handler.get_my_plans);
router.get('/goals/my', verify_bde_auth, handler.get_my_goals);

// Store Setup & 16-Step Physical Inspection Execution
router.get('/store-setup', verify_bde_auth, handler.get_my_store_setups);
router.get('/store-setup/:id', verify_bde_auth, handler.get_bde_store_setup_detail);
router.put('/store-setup/:id/checklist/:activity_id', verify_bde_auth, proofUpload, employeeHandler.update_checklist_activity);
router.post('/store-setup/:id/checklist/:activity_id', verify_bde_auth, proofUpload, employeeHandler.update_checklist_activity);
router.post('/store-setup/:id/submit-verification', verify_bde_auth, employeeHandler.submit_for_admin_verification);
router.post('/store-setup/:id/delay-request', verify_bde_auth, proofUpload, employeeHandler.submit_delay_request);

// ── Step 2: BDE Leads & Franchisee Pipeline ───────────────────────────────────
router.post('/leads/create', verify_bde_auth, handler.create_bde_lead);
router.get('/leads/list', verify_bde_auth, handler.list_bde_leads);
router.get('/leads/detail/:id', verify_bde_auth, handler.get_bde_lead_detail);
router.put('/leads/update/:id', verify_bde_auth, handler.update_bde_lead);
router.post('/leads/activity/:id', verify_bde_auth, handler.add_lead_activity);
router.post('/leads/follow-up/:id', verify_bde_auth, handler.schedule_follow_up);
router.put('/leads/stage/:id', verify_bde_auth, handler.update_lead_stage);
router.post('/leads/start-signup/:id', verify_bde_auth, handler.start_franchisee_signup);
router.get('/pipeline', verify_bde_auth, handler.get_bde_pipeline);
router.get('/franchisees', verify_bde_auth, handler.get_my_franchisees);

module.exports = router;

