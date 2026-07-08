const { body } = require("express-validator");

/** Accepts: 05X-XXXXXXX | 05XXXXXXXX | 0X-XXXXXXX (landlines) */
const IL_PHONE_RE = /^0(5[0-9][-]?\d{7}|[2-9]\d[-]?\d{6,7})$/;

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
  body("fulfillment.pickupLocation")
    .optional()
    .isIn(["bnei_brak", "jerusalem"])
    .withMessage("Invalid pickup location"),
  body("pointsRedeemed").optional().isInt({ min: 0 }),
  body("paymentMethod")
    .optional()
    .isIn(["card", "cash"])
    .withMessage("Invalid payment method"),
  body("guestInfo.name").optional().isString().trim().notEmpty().withMessage("Guest name is required"),
  body("guestInfo.phone")
    .optional()
    .isString()
    .custom((val) => {
      if (!val) return true;
      const normalized = val.replace(/\s/g, "");
      if (!IL_PHONE_RE.test(normalized)) {
        throw new Error("מספר טלפון לא תקין — יש להזין מספר ישראלי תקני");
      }
      return true;
    }),
  body("guestInfo.email").optional({ checkFalsy: true }).isEmail(),
];

const statusRules = [
  body("status").isIn(ORDER_STATUSES).withMessage("Invalid order status"),
];

const itemStatusRules = [
  body("itemStatus").isIn(ITEM_STATUSES).withMessage("Invalid item status"),
];

module.exports = { createRules, statusRules, itemStatusRules };
