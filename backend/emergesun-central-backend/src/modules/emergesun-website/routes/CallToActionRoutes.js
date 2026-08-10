const express = require("express");

const {
  createCallToAction,
  getCallToAction,
  updateCallToAction,
  updateCallToActionStatus,
  deleteCallToAction,
} = require("../controller/CallToActionController");

const router = express.Router();

router.post("/create", createCallToAction);

router.get("/get", getCallToAction);

router.put("/update/:id", updateCallToAction);

router.patch("/status/:id", updateCallToActionStatus);

router.delete("/delete/:id", deleteCallToAction);

module.exports = router;
