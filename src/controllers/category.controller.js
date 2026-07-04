const asyncHandler = require("../utils/asyncHandler");
const Category = require("../models/category.model");
const ApiError = require("../utils/ApiError");

const list = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ displayOrder: 1, name: 1 });
  res.json({ success: true, data: categories });
});

const listActive = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({
    displayOrder: 1,
  });
  res.json({ success: true, data: categories });
});

const create = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
});

const update = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw ApiError.notFound("Category not found");
  res.json({ success: true, data: category });
});

const remove = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");
  res.json({ success: true, message: "Category deleted" });
});

module.exports = { list, listActive, create, update, remove };
