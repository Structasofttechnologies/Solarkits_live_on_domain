const express = require('express');
const router = express.Router();
const { getAmcConfig, saveAmcConfig } = require('../controller/amc.controller');

router.get('/get', getAmcConfig);
router.patch('/update', saveAmcConfig);

module.exports = router;
