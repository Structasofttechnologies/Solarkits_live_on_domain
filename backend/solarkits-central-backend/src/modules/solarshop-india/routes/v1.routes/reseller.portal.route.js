/**
 * reseller.portal.route.js
 *
 * Express router for Reseller Portal self-service APIs.
 * Prefix: /api/india/v1/reseller
 *
 * Phase 2 — Reseller Management System
 */

const express = require('express');
const router = express.Router();

const { verify_reseller_auth } = require('../../middlewares/verify_reseller_auth');
const handler = require('../../controller/reseller.portal.handler');
const { upload_files, upload_any_files } = require('../../../admin-panel/utils/upload.files');

const kycDocUpload = upload_any_files('public/uploads/kyc', 10);

// ── Public Auth & Registration ───────────────────────────────────────────────
router.get('/types', handler.get_active_types);
router.post('/auth/register', handler.register_reseller);
router.post('/auth/login', handler.login_reseller);
router.post('/auth/logout', handler.logout_reseller);

// ── GST Verification (Public format & adapter check) ──────────────────────────
router.post('/gst/verify', handler.verify_gstin);

// ── Protected Reseller Endpoints ──────────────────────────────────────────────
router.get('/auth/me', verify_reseller_auth, handler.get_reseller_me);
router.get('/territories', verify_reseller_auth, handler.get_reseller_my_territories);
router.get('/authorized-products', verify_reseller_auth, handler.get_reseller_authorized_products);
router.post('/kyc/upload', verify_reseller_auth, kycDocUpload, handler.upload_kyc_document);
router.post('/kyc/submit', verify_reseller_auth, handler.submit_kyc);
router.get('/plans/list', handler.get_active_plans);
router.post('/plans/subscribe', verify_reseller_auth, handler.subscribe_plan);
router.post('/epc-buyers/register', verify_reseller_auth, handler.register_epc_buyer);
router.get('/epc-buyers/list', verify_reseller_auth, handler.list_my_epc_buyers);
router.post('/checkout/validate', verify_reseller_auth, require('../../../admin-panel/controller/reseller.checkout.handler').validate_checkout);

// Wallet & Ledger Routes
const walletPortalHandler = require('../../../admin-panel/controller/reseller.wallet.portal.handler');
router.get('/wallet/me', verify_reseller_auth, walletPortalHandler.get_my_wallet);
router.get('/wallet/ledger', verify_reseller_auth, walletPortalHandler.get_my_ledger);
router.post('/wallet/withdraw', verify_reseller_auth, walletPortalHandler.request_withdrawal);
router.get('/wallet/payouts', verify_reseller_auth, walletPortalHandler.get_my_payouts);

module.exports = router;
