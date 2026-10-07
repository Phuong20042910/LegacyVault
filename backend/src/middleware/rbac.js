/**
 * RBAC Middleware — Role-Based Access Control
 * Usage: router.get("/route", auth, requireRole("admin", "verifier"), handler)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Chưa xác thực." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Truy cập bị từ chối. Vai trò '${req.user.role}' không có quyền thực hiện thao tác này.`,
      });
    }
    next();
  };
};

module.exports = { requireRole };
