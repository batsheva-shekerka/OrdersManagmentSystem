const asyncHandler = require("../utils/asyncHandler");
const orderService = require("../services/order.service");
const ApiError = require("../utils/ApiError");

const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user || null);
  res.status(201).json({ success: true, data: order });
});

const list = asyncHandler(async (req, res) => {
  const orders = await orderService.getOrders({ status: req.query.status });
  res.json({ success: true, data: orders });
});

const mine = asyncHandler(async (req, res) => {
  const orders = await orderService.getOrdersByUser(req.user.id);
  res.json({ success: true, data: orders });
});

const getOne = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  const isOwner = order.user && String(order.user) === String(req.user.id);
  if (req.user.role !== "admin" && !isOwner) {
    throw ApiError.forbidden("You cannot access this order");
  }
  res.json({ success: true, data: order });
});

const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status
  );
  res.json({ success: true, data: order });
});

const updateItemStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateItemStatus(
    req.params.id,
    req.params.itemId,
    req.body.itemStatus
  );
  res.json({ success: true, data: order });
});

module.exports = { create, list, mine, getOne, updateStatus, updateItemStatus };
