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
// Phase R1: Rate limiting on reseller auth and GST verify endpoints
const { authRateLimiter, gstRateLimiter } = require('../../../admin-panel/middlewares/rate.limit');

const kycDocUpload = upload_any_files('public/uploads/kyc', 10);

// ── Public Auth & Registration ───────────────────────────────────────────────
router.get('/types', handler.get_active_types);
router.post('/auth/register', authRateLimiter, handler.register_reseller);
router.post('/auth/login',    authRateLimiter, handler.login_reseller);
router.post('/auth/logout', handler.logout_reseller);

// ── GST Verification (Public format & adapter check) ──────────────────────────
router.post('/gst/verify', gstRateLimiter, handler.verify_gstin);

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

// Procurement & Stock Inventory Routes
const procurementHandler = require('../../../admin-panel/controller/reseller.procurement.handler');
router.post('/procurement/create', verify_reseller_auth, procurementHandler.create_order);
router.post('/procurement/confirm-payment', verify_reseller_auth, procurementHandler.confirm_procurement_payment);
router.get('/procurement/list', verify_reseller_auth, procurementHandler.list_procurement_orders);
router.get('/inventory', verify_reseller_auth, procurementHandler.get_inventory_balance);

// Storefront Listings Routes & Lifecycle Actions
const pricingHandler = require('../../../admin-panel/controller/reseller.pricing.handler');
const checkoutHandler = require('../../../admin-panel/controller/reseller.checkout.handler');
router.get('/listings', verify_reseller_auth, pricingHandler.list_reseller_listings);
router.post('/listings', verify_reseller_auth, pricingHandler.upsert_reseller_listing);
router.post('/listings/:id/purchase', verify_reseller_auth, pricingHandler.purchase_reseller_product);
router.post('/listings/:id/margin', verify_reseller_auth, pricingHandler.update_reseller_margin);
router.post('/listings/:id/publish', verify_reseller_auth, pricingHandler.publish_reseller_listing);
router.post('/listings/:id/unpublish', verify_reseller_auth, pricingHandler.unpublish_reseller_listing);

// EPC Buyer Checkout Routes
router.post('/epc-checkout/create', checkoutHandler.create_epc_order);
router.post('/epc-checkout/confirm', checkoutHandler.confirm_epc_payment);

// EPC Wallet Routes (authenticated via verify_auth)
const { verify_auth } = require('../../middlewares/auth');
const epcWalletHandler = require('../../../admin-panel/controller/epc.wallet.handler');
router.get('/epc/wallet/me', verify_auth, epcWalletHandler.get_my_wallet);
router.get('/epc/wallet/ledger', verify_auth, epcWalletHandler.get_my_ledger);

// ── Industry Content Dashboard Routes ─────────────────────────────────────────
// These routes serve industry-aware content to the authenticated reseller's dashboard.
// All requests are double-validated: JWT + approved UserIndustryMap.
const industryDashboardHandler = require('../../controller/industry.dashboard.handler');
router.get('/industry/my-industries',   verify_reseller_auth, industryDashboardHandler.get_my_industries);
router.post('/industry/select',         verify_reseller_auth, industryDashboardHandler.select_industry);
router.get('/industry/dashboard-content', verify_reseller_auth, industryDashboardHandler.get_dashboard_content);
router.get('/industry/related-products',  verify_reseller_auth, industryDashboardHandler.get_related_products);
router.get('/industry/theme',             verify_reseller_auth, industryDashboardHandler.get_industry_theme);

module.exports = router;

