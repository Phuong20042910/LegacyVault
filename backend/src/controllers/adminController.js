const User = require("../models/User");
const Vault = require("../models/Vault");
const AuditLog = require("../models/AuditLog");
const VerificationRequest = require("../models/VerificationRequest");
const { AUDIT_ACTIONS } = require("../config/constants");

// GET /api/admin/stats — System overview
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalVaults, pendingVerifications, recentLogs] = await Promise.all([
      User.countDocuments({}),
      Vault.countDocuments({}),
      VerificationRequest.countDocuments({ status: { $in: ["SUBMITTED", "IN_REVIEW"] } }),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(10),
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const vaultsByStatus = await Vault.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalVaults,
        pendingVerifications,
        usersByRole,
        vaultsByStatus,
        recentActivity: recentLogs,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/admin/users — List all users (FR-022)
exports.listUsers = async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      users,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/admin/users — Create user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải dài ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email đã tồn tại." });
    }

    const user = await User.create({ name, email, passwordHash: password, role, phone });
    await req.audit(AUDIT_ACTIONS.USER_REGISTERED, user._id, "User", { createdByAdmin: true, role });
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// PUT /api/admin/users/:id — Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, role, phone, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, phone, isActive },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/admin/users/:id/lock — Lock account (FR-022)
exports.lockUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Không thể tự khóa tài khoản của mình." });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
    await req.audit(AUDIT_ACTIONS.ADMIN_USER_LOCKED, user._id, "User");
    res.json({ success: true, message: "Đã khóa tài khoản.", user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/admin/users/:id/unlock — Unlock account
exports.unlockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true, loginAttempts: 0, lockedUntil: null },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
    await req.audit(AUDIT_ACTIONS.ADMIN_USER_UNLOCKED, user._id, "User");
    res.json({ success: true, message: "Đã mở khóa tài khoản.", user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/admin/audit — Immutable audit log (FR-023, BR-007)
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, userId, targetType, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (targetType) filter.targetType = targetType;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("userId", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      logs,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/admin/config — Get system config
exports.getConfig = async (req, res) => {
  res.json({
    success: true,
    config: {
      defaultCheckIntervalDays: parseInt(process.env.DEFAULT_CHECK_INTERVAL_DAYS || "30"),
      defaultGracePeriodDays: parseInt(process.env.DEFAULT_GRACE_PERIOD_DAYS || "14"),
      maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || "500"),
      dmsCronCheck: process.env.DMS_CRON_CHECK || "0 * * * *",
      dmsCronEscalate: process.env.DMS_CRON_ESCALATE || "0 */6 * * *",
      smtpConfigured: !!process.env.SMTP_USER,
      ekycConfigured: !!process.env.FPTAI_EKYC_API_KEY,
    },
  });
};
