const express = require('express');
const router = express.Router();
const {
  loginUser,
  registerUser,
  getProfile,
} = require('../controller/auth.login.controller');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/profile', getProfile);
router.get('/me', getProfile);

module.exports = router;
