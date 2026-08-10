const express = require("express");
const router = express.Router();

const {
  saveHappyUsersConfig,
  getHappyUsersConfig,
} = require("../controller/happy_users.controller");

router.post("/save", saveHappyUsersConfig);
router.post("/create", saveHappyUsersConfig);
router.get("/get", getHappyUsersConfig);

module.exports = router;
