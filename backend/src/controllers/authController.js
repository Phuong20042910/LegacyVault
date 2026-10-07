const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AUDIT_ACTIONS } = require("../config/constants");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, nationalId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Email không đúng định dạng." });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 8 ký tự." });
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ success: false, message: "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số." });
    }

    if (phone) {
      const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
      if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
        return res.status(400).json({ success: false, message: "Số điện thoại không hợp lệ." });
      }
    }

    const validRoles = ["owner", "executor", "beneficiary", "verifier"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Vai trò không hợp lệ." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email đã được đăng ký." });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role,
      phone,
      nationalId,
    });

    await req.audit(AUDIT_ACTIONS.USER_REGISTERED, user._id, "User", { role });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: "Đăng ký thành công.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email và mật khẩu là bắt buộc." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
    }

    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: "Tài khoản tạm thời bị khóa. Vui lòng thử lại sau.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Tài khoản đã bị vô hiệu hóa." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
        user.loginAttempts = 0;
      }
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng." });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    await req.audit(AUDIT_ACTIONS.USER_LOGGED_IN, user._id, "User", {
      ip: req.ip,
    });

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: "Đăng nhập thành công.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// PUT /api/auth/me — Update own profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, nationalId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, nationalId },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin." });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Mật khẩu hiện tại không đúng." });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ success: true, message: "Đổi mật khẩu thành công." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

const crypto = require("crypto");

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Vui lòng nhập email." });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng với email này." });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Since there's no real email setup, we return the token directly for testing purposes.
    // In production, send this token via email (e.g. using nodemailer)
    res.json({ 
      success: true, 
      message: "Email khôi phục mật khẩu đã được gửi. (Demo: Vui lòng sử dụng token này để đổi mật khẩu)",
      token: resetToken 
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin." });
    }

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn." });
    }

    // Set new password
    user.passwordHash = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: "Khôi phục mật khẩu thành công. Vui lòng đăng nhập lại." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
