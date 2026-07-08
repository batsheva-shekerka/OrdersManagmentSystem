const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const { user, token } = await authService.register({
    name,
    email,
    phone,
    password,
  });
  res.status(201).json({ success: true, user, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login({ email, password });
  res.json({ success: true, user, token });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json({ success: true, user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const user = await authService.updateProfile(req.user.id, { name, email, phone });
  res.json({ success: true, user });
});

module.exports = { register, login, me, updateProfile };
