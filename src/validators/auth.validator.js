const { body } = require("express-validator");

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),
  body("phone").optional({ checkFalsy: true }).isString(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginRules = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = { registerRules, loginRules };
