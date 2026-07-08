const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

async function register({ name, email, phone, password }) {
  if (email) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw ApiError.badRequest("Email already registered");
    }
  }

  const user = new User({ name, email, phone, role: "customer" });
  await user.setPassword(password);
  await user.save();

  return { user, token: generateToken(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid credentials");
  }
  if (!user.isActive) {
    throw ApiError.forbidden("Account is disabled");
  }

  return { user, token: generateToken(user) };
}

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return user;
}

async function updateProfile(userId, { name, email, phone }) {
  if (email) {
    const existing = await User.findOne({ email, _id: { $ne: userId } });
    if (existing) throw ApiError.badRequest("Email already in use");
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { name, ...(email !== undefined && { email }), ...(phone !== undefined && { phone }) },
    { new: true, runValidators: true }
  );
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

module.exports = { register, login, getProfile, updateProfile, generateToken };
