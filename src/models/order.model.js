const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    itemStatus: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "cancelled"],
      default: "pending",
    },
  },
  { _id: true }
);

const guestInfoSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: false }
);

const fulfillmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["delivery", "dine_in", "pickup"],
      required: true,
    },
    deliveryAddress: { type: String, trim: true },
    tableNumber: { type: String, trim: true },
    pickupTime: { type: Date },
    pickupLocation: {
      type: String,
      enum: ["bnei_brak", "jerusalem"],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestInfo: { type: guestInfoSchema, default: undefined },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "Order must contain at least one item",
      },
    },
    status: {
      type: String,
      enum: ["pending", "in_preparation", "ready", "delivered", "cancelled"],
      default: "pending",
    },
    fulfillment: { type: fulfillmentSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discountApplied: { type: Number, default: 0, min: 0 },
    pointsRedeemed: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    pointsEarned: { type: Number, default: 0, min: 0 },
    appliedTier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PointsTier",
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "cash"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cash_on_delivery"],
      default: "cash_on_delivery",
    },
  },
  { timestamps: true }
);

orderSchema.pre("validate", function generateOrderNumber(next) {
  if (!this.orderNumber) {
    const random = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${random}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
