const express = require('express');
const { createHeader, updateHeader, getHeader } = require('../controller/header.controller');
const website_router = express.Router();

//create 
website_router.post('/create', createHeader);

//update 
website_router.patch('/update/:id', updateHeader);

// //get 
website_router.get('/get', getHeader);

module.exports = website_router;