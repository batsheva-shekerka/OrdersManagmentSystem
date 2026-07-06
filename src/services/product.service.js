const mongoose = require("mongoose");
const Category = require("../models/category.model");
const Product = require("../models/product.model");
const ApiError = require("../utils/ApiError");

/**
 * Search for available products by optional category and optional max price.
 *
 * @param {string} [category]  - Category name, slug, or MongoDB ObjectId string.
 * @param {number} [maxPrice]  - Upper price bound (inclusive).
 * @returns {Promise<import("../models/product.model")[]} Array of matching Product documents.
 *
 * Designed to be called directly by Agent tools without req/res coupling.
 */
async function searchProducts({ category, maxPrice } = {}) {
  const query = { status: "available", isActive: true };

  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    } else {
      const cat = await Category.findOne({
        $or: [
          { name: { $regex: `^${category}$`, $options: "i" } },
          { slug: category.toLowerCase().replace(/\s+/g, "-") },
        ],
      });
      if (!cat) return [];
      query.category = cat._id;
    }
  }

  if (maxPrice !== undefined && maxPrice !== null) {
    query.price = { $lte: Number(maxPrice) };
  }

  const products = await Product.find(query)
    .populate("category", "name slug")
    .sort({ displayOrder: 1, name: 1 });

  return products;
}

/**
 * Fetch a single product by its MongoDB ObjectId string.
 * Throws ApiError.notFound if the product does not exist.
 *
 * @param {string} productId
 * @returns {Promise<import("../models/product.model")>}
 */
async function getProductById(productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw ApiError.badRequest(`Invalid product id: ${productId}`);
  }
  const product = await Product.findById(productId).populate(
    "category",
    "name slug"
  );
  if (!product) throw ApiError.notFound(`Product not found: ${productId}`);
  return product;
}

module.exports = { searchProducts, getProductById };
