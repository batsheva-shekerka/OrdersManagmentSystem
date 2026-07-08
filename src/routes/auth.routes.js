const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { registerRules, loginRules, updateProfileRules } = require("../validators/auth.validator");
const authController = require("../controllers/auth.controller");

router.post("/register", registerRules, validate, authController.register);
router.post("/login", loginRules, validate, authController.login);
router.get("/me", requireAuth, authController.me);
router.patch("/me", requireAuth, updateProfileRules, validate, authController.updateProfile);

module.exports = router;
