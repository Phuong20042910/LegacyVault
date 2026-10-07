const crypto = require("crypto");
const AuditLog = require("../models/AuditLog");

/**
 * Create an immutable audit log entry (BR-007)
 * @param {Object} params
 */
const createAuditLog = async ({
  userId,
  userEmail,
  userRole,
  action,
  targetId,
  targetType,
  ipAddress,
  userAgent,
  metadata,
}) => {
  try {
    // Get last entry's hash for chain integrity (NFR-003)
    const lastLog = await AuditLog.findOne({}, { entryHash: 1 }).sort({ createdAt: -1 });
    const previousHash = lastLog ? lastLog.entryHash : "GENESIS";

    const payload = JSON.stringify({
      userId,
      action,
      targetId,
      ipAddress,
      timestamp: new Date().toISOString(),
      previousHash,
    });
    const entryHash = crypto.createHash("sha256").update(payload).digest("hex");

    await AuditLog.create({
      userId,
      userEmail,
      userRole,
      action,
      targetId: targetId ? String(targetId) : undefined,
      targetType,
      ipAddress,
      userAgent,
      metadata,
      previousHash,
      entryHash,
    });
  } catch (err) {
    // Audit log failure should never crash the main operation
    console.error("[AuditLog] Failed to create log entry:", err.message);
  }
};

/**
 * Express middleware that auto-extracts request info
 * and attaches createAuditLog to req.audit
 */
const auditMiddleware = (req, res, next) => {
  req.audit = async (action, targetId, targetType, metadata) => {
    await createAuditLog({
      userId: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      action,
      targetId,
      targetType,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      metadata,
    });
  };
  next();
};

module.exports = { auditMiddleware, createAuditLog };
