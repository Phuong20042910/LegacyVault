const Vault = require("../models/Vault");
const DigitalAsset = require("../models/DigitalAsset");
const DeadMansSwitchConfig = require("../models/DeadMansSwitchConfig");
const ExecutorAssignment = require("../models/ExecutorAssignment");
const { VAULT_STATUS, AUDIT_ACTIONS, DMS_DEFAULTS } = require("../config/constants");

// GET /api/vaults — List owner's vaults
exports.listVaults = async (req, res) => {
  try {
    const vaults = await Vault.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    // Attach DMS config
    const populated = await Promise.all(
      vaults.map(async (v) => {
        const dms = await DeadMansSwitchConfig.findOne({ vaultId: v._id });
        const assetCount = await DigitalAsset.countDocuments({ vaultId: v._id });
        return { ...v.toJSON(), dmsConfig: dms, assetCount };
      })
    );
    res.json({ success: true, vaults: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/vaults — Create new vault
exports.createVault = async (req, res) => {
  try {
    const { vaultName, masterKeySalt, encryptedMasterKey, description } = req.body;
    if (!vaultName || !masterKeySalt || !encryptedMasterKey) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }

    const vault = await Vault.create({
      ownerId: req.user._id,
      vaultName,
      masterKeySalt,
      encryptedMasterKey,
      description,
    });

    // Auto-create DMS config with defaults
    const nextPingDueAt = new Date();
    nextPingDueAt.setDate(nextPingDueAt.getDate() + DMS_DEFAULTS.CHECK_INTERVAL_DAYS);
    await DeadMansSwitchConfig.create({
      vaultId: vault._id,
      checkIntervalDays: DMS_DEFAULTS.CHECK_INTERVAL_DAYS,
      gracePeriodDays: DMS_DEFAULTS.GRACE_PERIOD_DAYS,
      nextPingDueAt,
    });

    await req.audit(AUDIT_ACTIONS.VAULT_CREATED, vault._id, "Vault", { vaultName });

    res.status(201).json({ success: true, vault });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/vaults/:id — Get single vault
exports.getVault = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });

    const dmsConfig = await DeadMansSwitchConfig.findOne({ vaultId: vault._id });
    const assetCount = await DigitalAsset.countDocuments({ vaultId: vault._id });
    const executors = await ExecutorAssignment.find({ vaultId: vault._id, status: "ACTIVE" })
      .populate("executorId", "name email");

    res.json({ success: true, vault: { ...vault.toJSON(), dmsConfig, assetCount, executors } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// PUT /api/vaults/:id — Update vault
exports.updateVault = async (req, res) => {
  try {
    const { vaultName, description } = req.body;
    const vault = await Vault.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { vaultName, description },
      { new: true, runValidators: true }
    );
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });

    await req.audit(AUDIT_ACTIONS.VAULT_UPDATED, vault._id, "Vault");
    res.json({ success: true, vault });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// DELETE /api/vaults/:id — Delete vault (only ACTIVE vaults)
exports.deleteVault = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });
    if (vault.status !== VAULT_STATUS.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể xóa kho đang ở trạng thái ACTIVE.",
      });
    }

    await DigitalAsset.deleteMany({ vaultId: vault._id });
    await DeadMansSwitchConfig.deleteOne({ vaultId: vault._id });
    await ExecutorAssignment.deleteMany({ vaultId: vault._id });
    await vault.deleteOne();

    await req.audit(AUDIT_ACTIONS.VAULT_DELETED, req.params.id, "Vault");
    res.json({ success: true, message: "Đã xóa kho lưu trữ." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/vaults/:id/stats
exports.getVaultStats = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });

    const [assetCount, dmsConfig, executorCount] = await Promise.all([
      DigitalAsset.countDocuments({ vaultId: vault._id }),
      DeadMansSwitchConfig.findOne({ vaultId: vault._id }),
      ExecutorAssignment.countDocuments({ vaultId: vault._id, status: "ACTIVE" }),
    ]);

    const claimedCount = await DigitalAsset.countDocuments({
      vaultId: vault._id,
      claimStatus: { $in: ["DOWNLOADED", "CONFIRMED"] },
    });

    res.json({
      success: true,
      stats: {
        vaultStatus: vault.status,
        assetCount,
        claimedCount,
        executorCount,
        dmsConfig: dmsConfig
          ? {
              checkIntervalDays: dmsConfig.checkIntervalDays,
              gracePeriodDays: dmsConfig.gracePeriodDays,
              lastCheckInAt: dmsConfig.lastCheckInAt,
              nextPingDueAt: dmsConfig.nextPingDueAt,
              consecutiveMisses: dmsConfig.consecutiveMisses,
              isEnabled: dmsConfig.isEnabled,
            }
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/vaults/:id/executors — Assign executor
exports.assignExecutor = async (req, res) => {
  try {
    const User = require("../models/User");
    const { executorEmail } = req.body;
    if (!executorEmail) {
      return res.status(400).json({ success: false, message: "Email người thi hành là bắt buộc." });
    }

    const vault = await Vault.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });

    const executor = await User.findOne({ email: executorEmail.toLowerCase(), role: "executor" });
    if (!executor) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản Người thi hành với email này." });
    }

    const existing = await ExecutorAssignment.findOne({ vaultId: vault._id, executorId: executor._id });
    if (existing) {
      if (existing.status === "ACTIVE") {
        return res.status(409).json({ success: false, message: "Người thi hành đã được gán cho kho này." });
      }
      existing.status = "ACTIVE";
      existing.revokedAt = undefined;
      await existing.save();
      await req.audit(AUDIT_ACTIONS.EXECUTOR_ASSIGNED, vault._id, "Vault", { executorId: executor._id });
      return res.json({ success: true, assignment: existing });
    }

    const assignment = await ExecutorAssignment.create({
      vaultId: vault._id,
      executorId: executor._id,
      assignedBy: req.user._id,
      inviteEmail: executorEmail,
    });

    await req.audit(AUDIT_ACTIONS.EXECUTOR_ASSIGNED, vault._id, "Vault", { executorId: executor._id });
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// DELETE /api/vaults/:id/executors/:executorId — Revoke executor (BR-004)
exports.revokeExecutor = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });

    const assignment = await ExecutorAssignment.findOne({
      vaultId: vault._id,
      executorId: req.params.executorId,
    });
    if (!assignment) return res.status(404).json({ success: false, message: "Không tìm thấy gán quyền." });

    assignment.status = "REVOKED";
    assignment.revokedAt = new Date();
    assignment.revokedBy = req.user._id;
    await assignment.save();

    await req.audit(AUDIT_ACTIONS.EXECUTOR_REVOKED, vault._id, "Vault", { executorId: req.params.executorId });
    res.json({ success: true, message: "Đã thu hồi quyền của Người thi hành." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
