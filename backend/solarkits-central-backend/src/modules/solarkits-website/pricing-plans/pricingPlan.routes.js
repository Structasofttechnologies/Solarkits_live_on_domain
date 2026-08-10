const express = require("express");
const router = express.Router();

const {
  createPricingPlan,
  getPricingPlans,
  getPricingPlanById,
  updatePricingPlan,
  deletePricingPlan,
  patchPricingPlanStatus,
} = require("./pricingPlan.controller");

const { validatePricingPlan } = require("./pricingPlan.validation");

// Routes
router.post("/create", validatePricingPlan, createPricingPlan);
router.get("/get", getPricingPlans);
router.get("/get/:id", getPricingPlanById);
router.put("/update/:id", validatePricingPlan, updatePricingPlan);
router.delete("/delete/:id", deletePricingPlan);
router.patch("/status/:id", patchPricingPlanStatus);

module.exports = router;

