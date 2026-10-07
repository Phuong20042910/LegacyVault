const rateLimit = require("express-rate-limit");

// Strict limiter for login endpoint (NFR-002, FR-023 brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload limiter (more lenient for large files)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: {
    success: false,
    message: "Vượt quá giới hạn tải lên. Vui lòng thử lại sau.",
  },
});

module.exports = { loginLimiter, apiLimiter, uploadLimiter };
