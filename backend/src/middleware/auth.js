const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Không có token xác thực. Vui lòng đăng nhập.",
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Phiên đăng nhập đã hết hạn." });
      }
      return res.status(401).json({ success: false, message: "Token không hợp lệ." });
    }

    const user = await User.findById(decoded.id).select("+isActive");
    if (!user) {
      return res.status(401).json({ success: false, message: "Tài khoản không tồn tại." });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Tài khoản đã bị khóa." });
    }
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: "Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ xác thực." });
  }
};

module.exports = auth;
