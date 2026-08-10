const express = require('express');
const { createAboutUs, updateAboutUs, getAboutUs } = require('../controller/about.controller');
const about_router = express.Router();

// create
about_router.post('/create', createAboutUs);

// update (with or without ID parameter)
about_router.patch('/update/:id', updateAboutUs);
about_router.patch('/update', updateAboutUs);

// get
about_router.get('/get', getAboutUs);

module.exports = about_router;
