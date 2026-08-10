const express = require("express");
const router = express.Router();
const { get_states, get_districts_by_state, get_district_boundary} = require("../../controller/v1.handlers/geo.handler");

router.get("/states", get_states);
router.get("/districts", get_districts_by_state);
router.get("/district-boundary", get_district_boundary);

module.exports = router;