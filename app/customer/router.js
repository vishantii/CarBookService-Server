var express = require("express");
var router = express.Router();
const {
  editProfile,
  profile,
  category,
  checkout,
  history,
  historyDetail,
} = require("./controller");

const { isLoginCustomer } = require("../middleware/auth");
const multer = require("multer");
const os = require("os");

router.get("/category", category);
router.post("/checkout", isLoginCustomer, checkout);
router.get("/history", isLoginCustomer, history);
router.get("/history/:id/detail", isLoginCustomer, historyDetail);
router.get("/profile", isLoginCustomer, profile);
router.put(
  "/profile",
  isLoginCustomer,
  multer({ dest: os.tmpdir() }).single("image"),
  editProfile
);

module.exports = router;
