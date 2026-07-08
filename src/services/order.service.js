const Order = require("../models/order.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const loyaltyService = require("./loyalty.service");
const { emitOrderNew, emitOrderStatusChanged } = require("../sockets");

async function buildLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest("Order must contain at least one item");
  }

  const productIds = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const lineItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productMap.get(String(item.product));
    if (!product) {
      throw ApiError.badRequest(`Product not found: ${item.product}`);
    }
    if (product.status !== "available" || !product.isActive) {
      throw ApiError.badRequest(`Product not available: ${product.name}`);
    }
    if (product.stock < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for ${product.name}`);
    }

    subtotal += product.price * item.quantity;
    lineItems.push({
      product: product._id,
      name: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
    });
  }

  return { lineItems, subtotal };
}

async function createOrder(payload, currentUser) {
  const { items, fulfillment, guestInfo, pointsRedeemed = 0, paymentMethod = "cash" } = payload;

  if (!fulfillment || !fulfillment.type) {
    throw ApiError.badRequest("Fulfillment type is required");
  }
  if (!currentUser && (!guestInfo || !guestInfo.name || !guestInfo.phone)) {
    throw ApiError.badRequest("Guest orders require name and phone");
  }

  const { lineItems, subtotal } = await buildLineItems(items);

  let redeem = 0;
  if (currentUser) {
    const user = await User.findById(currentUser.id);
    if (!user) {
      throw ApiError.unauthorized("User not found");
    }
    redeem = Math.max(0, Math.min(pointsRedeemed, user.loyaltyBalance, subtotal));
  } else if (pointsRedeemed > 0) {
    throw ApiError.badRequest("Guests cannot redeem points");
  }

  const discountApplied = redeem; // 1 point = 1 NIS
  const total = subtotal - discountApplied;

  const tier = await loyaltyService.resolveTier(subtotal);
  const pointsEarned = currentUser
    ? loyaltyService.computePoints(subtotal, tier)
    : 0;

  // Card payments are considered paid immediately (mock); cash is settled on delivery/pickup.
  const paymentStatus = paymentMethod === "card" ? "paid" : "cash_on_delivery";

  const order = await Order.create({
    user: currentUser ? currentUser.id : null,
    guestInfo: currentUser ? undefined : guestInfo,
    items: lineItems,
    fulfillment,
    subtotal,
    discountApplied,
    pointsRedeemed: redeem,
    total,
    pointsEarned,
    appliedTier: tier ? tier._id : null,
    paymentMethod,
    paymentStatus,
  });

  for (const item of lineItems) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: -item.quantity } }
    );
  }

  if (currentUser) {
    if (redeem > 0) {
      await loyaltyService.recordTransaction({
        userId: currentUser.id,
        orderId: order._id,
        type: "redeem",
        points: -redeem,
      });
    }
    if (pointsEarned > 0) {
      await loyaltyService.recordTransaction({
        userId: currentUser.id,
        orderId: order._id,
        type: "earn",
        points: pointsEarned,
      });
    }
  }

  emitOrderNew(order);
  return order;
}

async function getOrders(filter = {}) {
  const query = {};
  if (filter.status) query.status = filter.status;
  return Order.find(query)
    .populate("user", "name phone email")
    .sort({ createdAt: -1 });
}

async function getOrdersByUser(userId) {
  return Order.find({ user: userId }).sort({ createdAt: -1 });
}

async function getOrderById(id) {
  const order = await Order.findById(id);
  if (!order) {
    throw ApiError.notFound("Order not found");
  }
  return order;
}

async function updateOrderStatus(id, status) {
  const order = await getOrderById(id);
  order.status = status;
  await order.save();
  emitOrderStatusChanged(order);
  return order;
}

async function updateItemStatus(orderId, itemId, itemStatus) {
  const order = await getOrderById(orderId);
  const item = order.items.id(itemId);
  if (!item) {
    throw ApiError.notFound("Order item not found");
  }
  item.itemStatus = itemStatus;
  await order.save();
  emitOrderStatusChanged(order);
  return order;
}

module.exports = {
  createOrder,
  getOrders,
  getOrdersByUser,
  getOrderById,
  updateOrderStatus,
  updateItemStatus,
};
