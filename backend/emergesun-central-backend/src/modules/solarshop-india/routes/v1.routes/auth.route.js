const express = require("express");
const router = express.Router();
const {
  get_epcs_by_state,
  send_signup_otp,
  verify_signup_otp,
  create_account,
  resend_signup_otp,
  login,
  refresh_token,
  get_me,
  logout,
  send_forgot_password_otp,
  verify_forgot_password_otp,
  reset_password,
  send_epc_email_otp,
  verify_epc_email_otp
} = require("../../controller/v1.handlers/auth.handler");

router.get("/epcs-by-state", get_epcs_by_state);
router.post("/send-otp", send_signup_otp);
router.post("/verify-otp", verify_signup_otp);
router.post("/resend-otp", resend_signup_otp);
router.post("/send-epc-otp", send_epc_email_otp);
router.post("/verify-epc-otp", verify_epc_email_otp);
router.post("/create-account", create_account);
router.post("/login", login);
router.post("/refresh-token", refresh_token);
router.post('/forgot-password/send-otp', send_forgot_password_otp);
router.post('/forgot-password/verify-otp', verify_forgot_password_otp);
router.post('/forgot-password/reset-password', reset_password);
router.get("/me", get_me);
router.post("/logout", logout);

module.exports = router;