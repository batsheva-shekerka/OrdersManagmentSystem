const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return next(ApiError.unauthorized("Authentication token missing"));
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch (err) {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}

function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    req.user = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    // ignore invalid token for optional auth (treat as guest)
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
