const express = require('express');
const router = express.Router();
const check_auth = require('../middlewares/check.auth');
const handler = require('../controller/website.content.handler');

// Public route for storefront landing pages
router.get('/public/:websiteKey', handler.get_content);

// Admin-authenticated routes
router.get('/:websiteKey', check_auth, handler.get_content);
router.put('/:websiteKey', check_auth, handler.update_content);
router.post('/:websiteKey/reset', check_auth, handler.reset_content);

module.exports = router;
