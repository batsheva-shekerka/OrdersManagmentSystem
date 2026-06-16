const { body } = require("express-validator");

const createRules = [
  body("name").trim().notEmpty().withMessage("Tier name is required"),
  body("minAmount")
    .isFloat({ min: 0 })
    .withMessage("minAmount must be a non-negative number"),
  body("maxAmount")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("maxAmount must be a non-negative number"),
  body("pointsPercentage")
    .isFloat({ min: 0, max: 100 })
    .withMessage("pointsPercentage must be between 0 and 100"),
  body("isActive").optional().isBoolean(),
];

const updateRules = [
  body("name").optional().trim().notEmpty(),
  body("minAmount").optional().isFloat({ min: 0 }),
  body("maxAmount").optional({ nullable: true }).isFloat({ min: 0 }),
  body("pointsPercentage").optional().isFloat({ min: 0, max: 100 }),
  body("isActive").optional().isBoolean(),
];

module.exports = { createRules, updateRules };
