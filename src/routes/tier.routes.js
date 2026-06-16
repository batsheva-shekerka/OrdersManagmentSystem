const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const validate = require("../middlewares/validate.middleware");
const { createRules, updateRules } = require("../validators/tier.validator");
const tierController = require("../controllers/tier.controller");

router.get("/", requireAuth, authorize("admin"), tierController.list);
router.post(
  "/",
  requireAuth,
  authorize("admin"),
  createRules,
  validate,
  tierController.create
);
router.put(
  "/:id",
  requireAuth,
  authorize("admin"),
  updateRules,
  validate,
  tierController.update
);
router.delete("/:id", requireAuth, authorize("admin"), tierController.remove);

module.exports = router;
