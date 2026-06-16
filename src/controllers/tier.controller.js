const asyncHandler = require("../utils/asyncHandler");
const PointsTier = require("../models/pointsTier.model");
const ApiError = require("../utils/ApiError");

const list = asyncHandler(async (req, res) => {
  const tiers = await PointsTier.find().sort({ minAmount: 1 });
  res.json({ success: true, data: tiers });
});

const create = asyncHandler(async (req, res) => {
  const tier = await PointsTier.create(req.body);
  res.status(201).json({ success: true, data: tier });
});

const update = asyncHandler(async (req, res) => {
  const tier = await PointsTier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tier) throw ApiError.notFound("Points tier not found");
  res.json({ success: true, data: tier });
});

const remove = asyncHandler(async (req, res) => {
  const tier = await PointsTier.findByIdAndDelete(req.params.id);
  if (!tier) throw ApiError.notFound("Points tier not found");
  res.json({ success: true, message: "Points tier deleted" });
});

module.exports = { list, create, update, remove };
