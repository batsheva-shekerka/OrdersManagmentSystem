const User = require("../models/user.model");
const PointsTier = require("../models/pointsTier.model");
const LoyaltyTransaction = require("../models/loyaltyTransaction.model");
const ApiError = require("../utils/ApiError");

async function resolveTier(amount) {
  return PointsTier.findTierForAmount(amount);
}

function computePoints(amount, tier) {
  if (!tier) return 0;
  return Math.floor((amount * tier.pointsPercentage) / 100);
}

async function recordTransaction({ userId, orderId = null, type, points }) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  user.loyaltyBalance = Math.max(0, user.loyaltyBalance + points);
  await user.save();

  await LoyaltyTransaction.create({
    user: userId,
    order: orderId,
    type,
    points,
    balanceAfter: user.loyaltyBalance,
  });

  return user.loyaltyBalance;
}

async function getHistory(userId) {
  return LoyaltyTransaction.find({ user: userId }).sort({ createdAt: -1 });
}

module.exports = { resolveTier, computePoints, recordTransaction, getHistory };
