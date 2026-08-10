const express = require("express");
const router = express.Router();
const { getMarketplaceConfig, saveMarketplaceConfig } = require("../controller/marketplace.controller");

router.get("/get", getMarketplaceConfig);
router.patch("/update", saveMarketplaceConfig);

module.exports = router;
