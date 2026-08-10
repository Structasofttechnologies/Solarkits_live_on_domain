const express = require("express");
const router = express.Router();

router.use("/auth", require("./v1.routes/auth.route"));
router.use("/geo", require("./v1.routes/geo.route"));
router.use("/shop", require("./v1.routes/shop.route"));

module.exports = router;