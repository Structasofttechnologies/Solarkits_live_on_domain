const express = require("express");
const {
  createAboutDetails,
  updateAboutDetails,
  getAboutDetails,
} = require("../controller/about_details.controller");
const about_details_router = express.Router();

// Create
about_details_router.post("/create", createAboutDetails);

// Update
about_details_router.patch("/update/:id", updateAboutDetails);
about_details_router.patch("/update", updateAboutDetails);

// Get
about_details_router.get("/get", getAboutDetails);

module.exports = about_details_router;
