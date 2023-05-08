var express = require("express");
var router = express.Router();
const {
  index,
  actionStatus,
  actionDelete,
  secondIndex,
  invoice,
} = require("./controller");

const { isLoginAdmin } = require("../middleware/auth");

router.use(isLoginAdmin);
router.get("/", index);
router.get("/second", secondIndex);
router.put("/status/:id", actionStatus);
router.delete("/delete/:id", actionDelete);
router.get("/invoice/:id", invoice);

module.exports = router;
