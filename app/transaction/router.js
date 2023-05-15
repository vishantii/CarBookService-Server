var express = require("express");
var router = express.Router();
const {
  index,
  actionStatus,
  actionDelete,
  secondIndex,
  invoice,
  viewEdit,
  actionEdit,
  addSparepart,
  deleteSparepart,
  updateTransaction,
} = require("./controller");

const { isLoginAdmin } = require("../middleware/auth");

router.use(isLoginAdmin);
router.get("/", index);
router.get("/edit/:id", viewEdit);
router.post("/edit/:id", actionEdit);
router.delete("/:transactionId/sparepart/:sparepartId", deleteSparepart);
router.get("/second", secondIndex);
router.put("/status/:id", actionStatus);
router.delete("/delete/:id", actionDelete);
router.get("/invoice/:id", invoice);
router.post("/:id/add-sparepart", addSparepart);
router.put("/updateTransaction/:transactionId", updateTransaction);

module.exports = router;
