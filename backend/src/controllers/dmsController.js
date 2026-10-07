const DeadMansSwitchConfig = require("../models/DeadMansSwitchConfig");
const Vault = require("../models/Vault");
const crypto = require("crypto");
const { AUDIT_ACTIONS, VAULT_STATUS } = require("../config/constants");

// GET /api/vaults/:id/dms — Get DMS config
exports.getDmsConfig = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });

    const config = await DeadMansSwitchConfig.findOne({ vaultId: vault._id });
    if (!config) return res.status(404).json({ success: false, message: "Chưa cấu hình Dead Man's Switch." });

    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// PUT /api/vaults/:id/dms — Update DMS config (FR-003)
exports.updateDmsConfig = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });
    if (vault.status !== VAULT_STATUS.ACTIVE) {
      return res.status(400).json({ success: false, message: "Chỉ có thể cấu hình DMS khi kho ở trạng thái ACTIVE." });
    }

    const { checkIntervalDays, gracePeriodDays, notificationChannels, isEnabled } = req.body;

    const updateData = {};
    if (checkIntervalDays !== undefined) {
      if (checkIntervalDays < 7 || checkIntervalDays > 365) {
        return res.status(400).json({ success: false, message: "Chu kỳ phải từ 7 đến 365 ngày." });
      }
      updateData.checkIntervalDays = checkIntervalDays;
      // Recalculate next ping
      const next = new Date();
      next.setDate(next.getDate() + checkIntervalDays);
      updateData.nextPingDueAt = next;
    }
    if (gracePeriodDays !== undefined) {
      if (gracePeriodDays !== 14) {
        return res.status(400).json({ success: false, message: "Thời gian ân hạn (grace period) cố định là 14 ngày." });
      }
      updateData.gracePeriodDays = gracePeriodDays;
    }
    if (notificationChannels !== undefined) updateData.notificationChannels = notificationChannels;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;

    const config = await DeadMansSwitchConfig.findOneAndUpdate(
      { vaultId: vault._id },
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/vaults/:id/checkin — Heartbeat reset (FR-008, BR-003, BR-008)
exports.heartbeatCheckin = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });

    if (![VAULT_STATUS.ACTIVE, VAULT_STATUS.GRACE_PERIOD].includes(vault.status)) {
      return res.status(400).json({
        success: false,
        message: "Không thể điểm danh khi kho không ở trạng thái ACTIVE hoặc GRACE_PERIOD.",
      });
    }

    const config = await DeadMansSwitchConfig.findOne({ vaultId: vault._id });
    if (!config) return res.status(404).json({ success: false, message: "Chưa cấu hình DMS." });

    const now = new Date();
    const nextPingDueAt = new Date(now);
    nextPingDueAt.setDate(nextPingDueAt.getDate() + config.checkIntervalDays);

    config.lastCheckInAt = now;
    config.nextPingDueAt = nextPingDueAt;
    config.consecutiveMisses = 0;
    config.graceStartedAt = null;
    await config.save();

    // Reset vault to ACTIVE if it was in GRACE_PERIOD (BR-008)
    if (vault.status === VAULT_STATUS.GRACE_PERIOD) {
      vault.status = VAULT_STATUS.ACTIVE;
      await vault.save();
    }

    await req.audit(AUDIT_ACTIONS.HEARTBEAT_RESET, vault._id, "Vault", {
      nextPingDueAt,
    });

    res.json({
      success: true,
      message: "Điểm danh sinh tồn thành công! Kho đã được reset.",
      nextPingDueAt,
      vaultStatus: vault.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/heartbeat/:token — Token-based heartbeat from email link (FR-008)
exports.heartbeatByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const config = await DeadMansSwitchConfig.findOne({
      heartbeatToken: token,
    }).select("+heartbeatToken +heartbeatTokenExpiresAt");

    if (!config) {
      return res.status(400).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:40px;">
          <h2>❌ Liên kết không hợp lệ</h2>
          <p>Mã xác nhận không đúng hoặc đã được sử dụng.</p>
        </body></html>
      `);
    }

    if (config.heartbeatTokenExpiresAt < new Date()) {
      return res.status(400).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:40px;">
          <h2>⏰ Liên kết đã hết hạn</h2>
          <p>Vui lòng đăng nhập vào hệ thống để xác nhận.</p>
        </body></html>
      `);
    }

    const vault = await Vault.findById(config.vaultId);
    const now = new Date();
    const nextPingDueAt = new Date(now);
    nextPingDueAt.setDate(nextPingDueAt.getDate() + config.checkIntervalDays);

    config.lastCheckInAt = now;
    config.nextPingDueAt = nextPingDueAt;
    config.consecutiveMisses = 0;
    config.graceStartedAt = null;
    config.heartbeatToken = undefined;
    config.heartbeatTokenExpiresAt = undefined;
    await config.save();

    if (vault && vault.status === VAULT_STATUS.GRACE_PERIOD) {
      vault.status = VAULT_STATUS.ACTIVE;
      await vault.save();
    }

    const { createAuditLog } = require("../middleware/auditLogger");
    await createAuditLog({
      userId: vault?.ownerId,
      action: AUDIT_ACTIONS.HEARTBEAT_RESET,
      targetId: config.vaultId,
      targetType: "Vault",
      metadata: { method: "email_token" },
    });

    res.send(`
      <html>
        <head><title>LegacyVault — Xác nhận thành công</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:60px;background:#f0fdf4;">
          <div style="max-width:400px;margin:0 auto;background:white;padding:40px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <div style="font-size:48px;margin-bottom:16px;">✅</div>
            <h2 style="color:#166534;">Xác nhận sinh tồn thành công!</h2>
            <p style="color:#4b5563;">Cảm ơn bạn đã xác nhận. Kho di sản của bạn đã được reset về trạng thái ACTIVE.</p>
            <p style="color:#9ca3af;font-size:0.875rem;">Lần kiểm tra tiếp theo: <strong>${nextPingDueAt.toLocaleDateString("vi-VN")}</strong></p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("<p>Lỗi máy chủ.</p>");
  }
};
