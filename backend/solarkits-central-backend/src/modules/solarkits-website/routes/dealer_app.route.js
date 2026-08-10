const express = require('express');
const router = express.Router();
const { getDealerAppConfig, saveDealerAppConfig } = require('../controller/dealer_app.controller');

router.get('/get', getDealerAppConfig);
router.patch('/update', saveDealerAppConfig);

module.exports = router;
