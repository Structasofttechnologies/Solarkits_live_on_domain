const express = require("express");
const router = express.Router();

const {
  saveErpModulesConfig,
  getErpModulesConfig,
} = require("../controller/erp_modules.controller");

router.post("/save", saveErpModulesConfig);
router.post("/create", saveErpModulesConfig);
router.get("/get", getErpModulesConfig);

module.exports = router;