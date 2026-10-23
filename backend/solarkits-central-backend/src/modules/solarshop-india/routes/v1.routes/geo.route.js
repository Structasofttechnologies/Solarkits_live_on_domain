const express = require("express");
const router = express.Router();
const { get_states, get_districts_by_state, get_district_boundary} = require("../../controller/v1.handlers/geo.handler");
const { optional_auth } = require("../../middlewares/auth");

router.get("/states", optional_auth, get_states);
router.get("/districts", optional_auth, get_districts_by_state);
router.get("/district-boundary", get_district_boundary);

module.exports = router;