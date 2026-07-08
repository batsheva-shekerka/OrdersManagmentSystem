const asyncHandler = require("../utils/asyncHandler");
const Product = require("../models/product.model");
const productService = require("../services/product.service");
const ApiError = require("../utils/ApiError");

const list = asyncHandler(async (req, res) => {
  const { category, status } = req.query;

  // Admin management view: every product regardless of status/isActive.
  if (status === "all") {
    const query = {};
    if (category) query.category = category;
    const products = await Product.find(query)
      .populate("category")
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: products });
  }

  // Admin-facing requests for non-available statuses bypass the service filter.
  if (status && status !== "available") {
    const query = { status };
    if (category) query.category = category;
    const products = await Product.find(query).populate("category");
    return res.json({ success: true, data: products });
  }

  const products = await productService.searchProducts({ category });
  res.json({ success: true, data: products });
});

const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.json({ success: true, data: product });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
  const product = await Product.create(data);
  res.status(201).json({ success: true, data: product });
});

const update = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
  const product = await Product.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  });
  if (!product) throw ApiError.notFound("Product not found");
  res.json({ success: true, data: product });
});

const updateStock = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock: req.body.stock },
    { new: true, runValidators: true }
  );
  if (!product) throw ApiError.notFound("Product not found");
  res.json({ success: true, data: product });
});

const remove = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");
  res.json({ success: true, message: "Product deleted" });
});

module.exports = { list, getOne, create, update, updateStock, remove };
