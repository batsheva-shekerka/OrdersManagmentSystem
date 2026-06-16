const mongoose = require("mongoose");

const pointsTierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    minAmount: { type: Number, required: true, min: 0 },
    maxAmount: { type: Number, default: null },
    pointsPercentage: { type: Number, required: true, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

pointsTierSchema.statics.findTierForAmount = function findTierForAmount(amount) {
  return this.findOne({
    isActive: true,
    minAmount: { $lte: amount },
    $or: [{ maxAmount: null }, { maxAmount: { $gte: amount } }],
  }).sort({ minAmount: -1 });
};

module.exports = mongoose.model("PointsTier", pointsTierSchema);
