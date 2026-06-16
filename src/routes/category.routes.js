const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validate = require("../middlewares/validate.middleware");
const { createRules, updateRules } = require("../validators/category.validator");
const categoryController = require("../controllers/category.controller");

router.get("/", categoryController.list);
router.post(
  "/",
  requireAuth,
  authorize("admin"),
  createRules,
  validate,
  categoryController.create
);
router.put(
  "/:id",
  requireAuth,
  authorize("admin"),
  updateRules,
  validate,
  categoryController.update
);
router.delete("/:id", requireAuth, authorize("admin"), categoryController.remove);

module.exports = router;
