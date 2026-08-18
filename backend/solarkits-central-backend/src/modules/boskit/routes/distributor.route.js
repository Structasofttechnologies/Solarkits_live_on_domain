'use strict';

const express = require('express');
const router = express.Router();

const { authenticateBoskitDistributor } = require('../middlewares/auth.middleware');
const { gstRateLimiter } = require('../../admin-panel/middlewares/rate.limit');
const onboardingController = require('../controllers/distributor/onboarding.controller');
const distributorController = require('../controllers/distributor/distributor.controller');

// ── Onboarding Wizard Routes (Accessible to prospective distributors) ──────────
router.get('/onboarding/state',          onboardingController.get_onboarding_state);
router.post('/onboarding/save-step',     onboardingController.save_onboarding_step);
router.post('/onboarding/gst-verify',    gstRateLimiter, onboardingController.verify_gst_live);
router.post('/onboarding/kyc-upload',    onboardingController.upload_kyc_document);
router.get('/onboarding/geo/states',     onboardingController.get_geo_states);
router.get('/onboarding/geo/districts',  onboardingController.get_geo_districts);
router.post('/onboarding/submit',        onboardingController.submit_onboarding_application);

// ── Authenticated Distributor Portal Routes ───────────────────────────────────
router.use(authenticateBoskitDistributor);
router.get('/entitlements',                     distributorController.get_distributor_entitlements);
router.get('/dashboard/stats',                  distributorController.get_distributor_dashboard_stats);
router.get('/dealers',                          distributorController.get_distributor_dealers);
router.post('/dealers/invite',                  distributorController.invite_dealer);
router.get('/dealer-applications',              distributorController.get_distributor_dealer_applications);
router.post('/dealer-applications/:id/review',  distributorController.review_dealer_application);
router.get('/territory',                        distributorController.get_distributor_territory);
router.get('/plan',                             distributorController.get_distributor_plan);

module.exports = router;
