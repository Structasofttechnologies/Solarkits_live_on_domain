const express = require("express");
const services_router = express.Router();
const {
  saveServicesConfig,
  getServicesConfig,
} = require("../controller/services.controller");

services_router.post("/update", saveServicesConfig);
services_router.patch("/update", saveServicesConfig);
services_router.get("/get", getServicesConfig);

module.exports = services_router;
