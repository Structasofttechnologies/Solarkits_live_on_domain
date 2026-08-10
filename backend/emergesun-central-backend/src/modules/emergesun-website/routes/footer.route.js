const express = require('express');
const { createFooterInfo, updateFooterInfo, getFooterInfo } = require('../controller/footer.controller');
const footer_router = express.Router();

// create
footer_router.post('/create', createFooterInfo);

// update (with or without ID parameter)
footer_router.patch('/update/:id', updateFooterInfo);
footer_router.patch('/update', updateFooterInfo);

// get
footer_router.get('/get', getFooterInfo);

module.exports = footer_router;
