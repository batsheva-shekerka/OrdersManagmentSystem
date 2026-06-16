const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validate = require("../middlewares/validate.middleware");
const upload = require("../utils/upload");
const {
  createRules,
  updateRules,
  stockRules,
} = require("../validators/product.validator");
const productController = require("../controllers/product.controller");

router.get("/", productController.list);
router.get("/:id", productController.getOne);
router.post(
  "/",
  requireAuth,
  authorize("admin"),
  upload.single("image"),
  createRules,
  validate,
  productController.create
);
router.put(
  "/:id",
  requireAuth,
  authorize("admin"),
  upload.single("image"),
  updateRules,
  validate,
  productController.update
);
router.patch(
  "/:id/stock",
  requireAuth,
  authorize("admin"),
  stockRules,
  validate,
  productController.updateStock
);
router.delete("/:id", requireAuth, authorize("admin"), productController.remove);

module.exports = router;
