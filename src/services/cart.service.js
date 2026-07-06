const mongoose = require("mongoose");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const ApiError = require("../utils/ApiError");

function assertValidObjectId(id, label) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`Invalid ${label}: ${id}`);
  }
}

/**
 * Add a product to a user's persistent server-side cart.
 *
 * - If the user has no cart yet, one is created automatically.
 * - If the item is already in the cart its quantity is incremented.
 * - Stock and availability are validated before updating.
 *
 * @param {string} userId     - MongoDB ObjectId string of the logged-in user.
 * @param {string} productId  - MongoDB ObjectId string of the product to add.
 * @param {number} [quantity] - How many units to add (defaults to 1).
 * @returns {Promise<object>} Updated Cart document with populated product details.
 *
 * Designed to be called directly by Agent tools without req/res coupling.
 */
async function addToCart(userId, productId, quantity = 1) {
  assertValidObjectId(userId, "userId");
  assertValidObjectId(productId, "productId");

  const qty = Number(quantity);
  if (!qty || qty < 1) {
    throw ApiError.badRequest("Quantity must be a positive integer");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound(`Product not found: ${productId}`);
  }
  if (product.status !== "available" || !product.isActive) {
    throw ApiError.badRequest(`Product is not available: ${product.name}`);
  }

  const existingCart = await Cart.findOne({ user: userId });
  const existingItem = existingCart?.items.find(
    (i) => String(i.product) === String(productId)
  );
  const currentQty = existingItem?.quantity || 0;

  if (product.stock < currentQty + qty) {
    throw ApiError.badRequest(
      `Insufficient stock for "${product.name}". Available: ${product.stock}, in cart: ${currentQty}, requested: ${qty}`
    );
  }

  let cart;

  if (existingItem) {
    cart = await Cart.findOneAndUpdate(
      { user: userId, "items.product": productId },
      { $inc: { "items.$.quantity": qty } },
      { new: true }
    ).populate("items.product", "name price imageUrl status");
  } else {
    cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $push: { items: { product: productId, quantity: qty } } },
      { new: true, upsert: true }
    ).populate("items.product", "name price imageUrl status");
  }

  return cart;
}

/**
 * Retrieve the current cart for a user (populated with product details).
 *
 * @param {string} userId
 * @returns {Promise<object|null>} Cart document or null if no cart exists.
 */
async function getCart(userId) {
  assertValidObjectId(userId, "userId");
  return Cart.findOne({ user: userId }).populate(
    "items.product",
    "name price imageUrl status"
  );
}

/**
 * Remove a single item from the cart.
 *
 * @param {string} userId
 * @param {string} productId
 * @returns {Promise<object>} Updated Cart document.
 */
async function removeFromCart(userId, productId) {
  assertValidObjectId(userId, "userId");
  assertValidObjectId(productId, "productId");
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $pull: { items: { product: productId } } },
    { new: true }
  ).populate("items.product", "name price imageUrl status");

  if (!cart) throw ApiError.notFound("Cart not found");
  return cart;
}

/**
 * Clear all items from a user's cart (e.g., after an order is placed).
 *
 * @param {string} userId
 * @returns {Promise<void>}
 */
async function clearCart(userId) {
  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
}

module.exports = { addToCart, getCart, removeFromCart, clearCart };
