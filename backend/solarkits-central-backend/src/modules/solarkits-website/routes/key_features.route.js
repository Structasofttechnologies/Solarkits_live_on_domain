const express = require("express");
const router = express.Router();

const {
  saveKeyFeaturesConfig,
  getKeyFeaturesConfig,
} = require("../controller/key_features.controller");

router.post("/save", saveKeyFeaturesConfig);
router.post("/create", saveKeyFeaturesConfig);
router.get("/get", getKeyFeaturesConfig);

module.exports = router;
