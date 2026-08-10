const express = require('express');
const router = express.Router();
const { getMegawattConfig, saveMegawattConfig } = require('../controller/megawatt.controller');

router.get('/get', getMegawattConfig);
router.patch('/update', saveMegawattConfig);

module.exports = router;
