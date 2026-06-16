const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(", ");
    return next(ApiError.badRequest(message));
  }
  next();
}

module.exports = validate;
