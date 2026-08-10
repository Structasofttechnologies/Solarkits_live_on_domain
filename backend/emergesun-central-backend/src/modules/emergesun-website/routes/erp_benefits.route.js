const express = require("express");
const router = express.Router();

const {
  saveErpBenefitsConfig,
  getErpBenefitsConfig,
} = require("../controller/erp_benefits.controller");

router.post("/save", saveErpBenefitsConfig);
router.post("/create", saveErpBenefitsConfig);
router.get("/get", getErpBenefitsConfig);

module.exports = router;
