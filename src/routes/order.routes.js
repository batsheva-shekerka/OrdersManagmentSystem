const express = require("express");
const router = express.Router();
const {
  requireAuth,
  optionalAuth,
} = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  createRules,
  statusRules,
  itemStatusRules,
} = require("../validators/order.validator");
const orderController = require("../controllers/order.controller");

router.post("/", optionalAuth, createRules, validate, orderController.create);
router.get("/", requireAuth, authorize("admin"), orderController.list);
router.get("/mine", requireAuth, orderController.mine);
router.get("/:id", requireAuth, orderController.getOne);
router.patch(
  "/:id/status",
  requireAuth,
  authorize("admin"),
  statusRules,
  validate,
  orderController.updateStatus
);
router.patch(
  "/:id/items/:itemId/status",
  requireAuth,
  authorize("admin"),
  itemStatusRules,
  validate,
  orderController.updateItemStatus
);

module.exports = router;
