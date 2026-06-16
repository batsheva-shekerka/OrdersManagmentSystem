const { body } = require("express-validator");

const createRules = [
  body("name").trim().notEmpty().withMessage("Category name is required"),
  body("description").optional().isString(),
  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("displayOrder must be a non-negative integer"),
  body("isActive").optional().isBoolean(),
];

const updateRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("description").optional().isString(),
  body("displayOrder").optional().isInt({ min: 0 }),
  body("isActive").optional().isBoolean(),
];

module.exports = { createRules, updateRules };
