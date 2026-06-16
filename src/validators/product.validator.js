const { body } = require("express-validator");

const STATUSES = ["available", "out_of_stock", "discontinued"];

const createRules = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),
  body("category").isMongoId().withMessage("A valid category id is required"),
  body("description").optional().isString(),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("status").optional().isIn(STATUSES).withMessage("Invalid product status"),
];

const updateRules = [
  body("name").optional().trim().notEmpty(),
  body("price").optional().isFloat({ min: 0 }),
  body("category").optional().isMongoId(),
  body("description").optional().isString(),
  body("stock").optional().isInt({ min: 0 }),
  body("status").optional().isIn(STATUSES),
];

const stockRules = [
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

module.exports = { createRules, updateRules, stockRules };
