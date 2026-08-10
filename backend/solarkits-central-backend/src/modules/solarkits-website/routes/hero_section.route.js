const express = require("express");
const hero_section_router = express.Router();
const {
  saveHeroSectionConfig,
  getHeroSectionConfig,
} = require("../controller/hero_section.controller");

hero_section_router.post("/save", saveHeroSectionConfig);
hero_section_router.post("/create", saveHeroSectionConfig);
hero_section_router.patch("/update", saveHeroSectionConfig);
hero_section_router.get("/get", getHeroSectionConfig);

module.exports = hero_section_router;
