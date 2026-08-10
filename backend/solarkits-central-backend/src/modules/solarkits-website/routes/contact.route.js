const express = require('express');
const { createContactInfo, updateContactInfo, getContactInfo } = require('../controller/contact.controller');
const contact_router = express.Router();

// create
contact_router.post('/create', createContactInfo);

// update (with or without ID parameter)
contact_router.patch('/update/:id', updateContactInfo);
contact_router.patch('/update', updateContactInfo);

// get
contact_router.get('/get', getContactInfo);

module.exports = contact_router;
