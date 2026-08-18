'use strict';

const express = require('express');
const router = express.Router();

const { authenticateBoskitDealer } = require('../middlewares/auth.middleware');
const dealerController = require('../controllers/dealer/dealer.controller');

// ── Public / Invite Registration ──────────────────────────────────────────────
router.post('/register', dealerController.register_dealer);

// ── Protected Dealer Portal Routes ────────────────────────────────────────────
router.get('/dashboard/stats',   authenticateBoskitDealer, dealerController.get_dealer_dashboard_stats);
router.get('/catalogue',         authenticateBoskitDealer, dealerController.get_dealer_catalogue);
router.get('/orders',            authenticateBoskitDealer, dealerController.get_dealer_orders);
router.get('/distributor-hub',   authenticateBoskitDealer, dealerController.get_dealer_distributor_hub);

module.exports = router;
