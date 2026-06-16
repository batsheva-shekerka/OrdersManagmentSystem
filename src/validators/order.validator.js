const { body } = require("express-validator");

const ORDER_STATUSES = [
  "pending",
  "in_preparation",
  "ready",
  "delivered",
  "cancelled",
];
const ITEM_STATUSES = ["pending", "preparing", "ready", "served", "cancelled"];

const createRules = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),
  body("items.*.product")
    .isMongoId()
    .withMessage("Each item needs a valid product id"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Each item quantity must be at least 1"),
  body("fulfillment.type")
    .isIn(["delivery", "dine_in", "pickup"])
    .withMessage("Invalid fulfillment type"),
  body("pointsRedeemed").optional().isInt({ min: 0 }),
  body("guestInfo.name").optional().isString(),
  body("guestInfo.phone").optional().isString(),
  body("guestInfo.email").optional({ checkFalsy: true }).isEmail(),
];

const statusRules = [
  body("status").isIn(ORDER_STATUSES).withMessage("Invalid order status"),
];

const itemStatusRules = [
  body("itemStatus").isIn(ITEM_STATUSES).withMessage("Invalid item status"),
];

module.exports = { createRules, statusRules, itemStatusRules };
