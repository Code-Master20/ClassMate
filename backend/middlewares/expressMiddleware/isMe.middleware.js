// middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../../utils/errorHandler.util");

const isMeMiddleware = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return new ErrorHandler(401, "Not authenticated").send(res);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_LOGGED_TRACK_SECRET_KEY);

    req.user = decoded; // payload from JWT
    next();
  } catch (err) {
    return new ErrorHandler(401, "Invalid or expired token").send(res);
  }
};

module.exports = isMeMiddleware;
