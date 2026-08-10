const express = require('express');
const router = express.Router();
const auth = require('../controller/auth.controller');

router.post('/send-epc-otp', auth.send_epc_otp);
router.post('/verify-epc-otp', auth.verify_epc_otp);
router.post('/create-account', auth.create_epc_account);
router.get('/epc-companies', auth.get_epc_companies);
router.get('/active-countries', auth.get_active_countries);
router.get('/active-states', auth.get_active_states);

module.exports = router;
