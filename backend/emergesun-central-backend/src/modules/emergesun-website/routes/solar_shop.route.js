const express = require("express");
const solar_shop_router = express.Router();
const {
  saveSolarShopConfig,
  getSolarShopConfig,
} = require("../controller/solar_shop.controller");

solar_shop_router.post("/update", saveSolarShopConfig);
solar_shop_router.patch("/update", saveSolarShopConfig);
solar_shop_router.get("/get", getSolarShopConfig);

module.exports = solar_shop_router;
