const express = require("express");
const router = express.Router();

const {
  saveErpScreenshotsConfig,
  getErpScreenshotsConfig,
} = require("../controller/erp_screenshots.controller");

router.post("/save", saveErpScreenshotsConfig);
router.post("/create", saveErpScreenshotsConfig);
router.get("/get", getErpScreenshotsConfig);

module.exports = router;
