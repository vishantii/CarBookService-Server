var express = require("express");
var router = express.Router();
const { schedule } = require("./controller");
const { isLoginCustomer } = require("../middleware/auth");

router.use(isLoginCustomer);
router.post("/availabilty", schedule);

module.exports = router;
