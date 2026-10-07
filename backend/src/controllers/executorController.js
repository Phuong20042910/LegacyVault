const ExecutorAssignment = require("../models/ExecutorAssignment");
const Vault = require("../models/Vault");
const DigitalAsset = require("../models/DigitalAsset");
const VerificationRequest = require("../models/VerificationRequest");
const { AUDIT_ACTIONS, VAULT_STATUS, VERIFICATION_STATUS } = require("../config/constants");
const path = require("path");

// GET /api/executor/assignments — Executor's assigned vaults
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await ExecutorAssignment.find({
      executorId: req.user._id,
      status: "ACTIVE",
    }).populate({
      path: "vaultId",
      populate: { path: "ownerId", select: "name email phone" },
    });

    const result = await Promise.all(
      assignments.map(async (a) => {
        const vault = a.vaultId;
        if (!vault) return null;
        const assetCount = await DigitalAsset.countDocuments({ vaultId: vault._id });
        const verReq = await VerificationRequest.findOne({ vaultId: vault._id }).sort({ createdAt: -1 });
        return {
          assignmentId: a._id,
          vault: {
            id: vault._id,
            name: vault.vaultName,
            status: vault.status,
            owner: vault.ownerId,
            assetCount,
          },
          verificationStatus: verReq ? verReq.status : null,
          invitedAt: a.invitedAt,
        };
      })
    );

    res.json({ success: true, assignments: result.filter(Boolean) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/executor/vaults/:vaultId/assets — View assigned vault assets (metadata only per FR-010)
exports.getVaultAssets = async (req, res) => {
  try {
    const assignment = await ExecutorAssignment.findOne({
      vaultId: req.params.vaultId,
      executorId: req.user._id,
      status: "ACTIVE",
    });
    if (!assignment) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập kho này." });
    }

    const vault = await Vault.findById(req.params.vaultId).populate("ownerId", "name email");
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });

    // FR-010: Executor sees metadata only (title, category), NOT encryptedPayload
    const assets = await DigitalAsset.find({ vaultId: vault._id })
      .select("title assetCategory claimStatus assignedBeneficiaryId createdAt")
      .populate("assignedBeneficiaryId", "name email");

    res.json({ success: true, vault: { id: vault._id, name: vault.vaultName, status: vault.status, owner: vault.ownerId }, assets });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/executor/vaults/:vaultId/submit — Submit verification request (FR-011)
exports.submitVerification = async (req, res) => {
  try {
    const assignment = await ExecutorAssignment.findOne({
      vaultId: req.params.vaultId,
      executorId: req.user._id,
      status: "ACTIVE",
    });
    if (!assignment) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập kho này." });
    }

    const vault = await Vault.findById(req.params.vaultId);
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });
    if (vault.status !== VAULT_STATUS.PENDING_VERIFICATION) {
      return res.status(400).json({
        success: false,
        message: `Kho phải ở trạng thái PENDING_VERIFICATION. Hiện tại: ${vault.status}`,
      });
    }

    // Check existing request
    const existing = await VerificationRequest.findOne({
      vaultId: vault._id,
      status: { $in: [VERIFICATION_STATUS.SUBMITTED, VERIFICATION_STATUS.IN_REVIEW] },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "Đã có yêu cầu thẩm định đang xử lý." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Giấy chứng tử là bắt buộc." });
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (req.file.size > MAX_SIZE) {
      return res.status(400).json({ success: false, message: "Kích thước giấy chứng tử không được vượt quá 50MB." });
    }

    const { additionalInfo } = req.body;
    const verReq = await VerificationRequest.create({
      vaultId: vault._id,
      executorId: req.user._id,
      deathCertificateUrl: req.file.path,
      deathCertificateOriginalName: req.file.originalname,
      additionalDocuments: [],
      status: VERIFICATION_STATUS.SUBMITTED,
    });

    await req.audit(AUDIT_ACTIONS.VERIFICATION_SUBMITTED, verReq._id, "VerificationRequest", { vaultId: vault._id });

    res.status(201).json({ success: true, verificationRequest: verReq, message: "Đã nộp hồ sơ thẩm định thành công." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/executor/vaults/:vaultId/progress — Delivery progress (FR-012)
exports.getProgress = async (req, res) => {
  try {
    const assignment = await ExecutorAssignment.findOne({
      vaultId: req.params.vaultId,
      executorId: req.user._id,
      status: "ACTIVE",
    });
    if (!assignment) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập kho này." });
    }

    const assets = await DigitalAsset.find({ vaultId: req.params.vaultId })
      .select("title assetCategory claimStatus assignedBeneficiaryId kycVerifiedAt downloadedAt confirmedAt")
      .populate("assignedBeneficiaryId", "name email");

    const verReq = await VerificationRequest.findOne({ vaultId: req.params.vaultId })
      .sort({ createdAt: -1 })
      .populate("verifierId", "name email");

    const summary = {
      total: assets.length,
      unclaimed: assets.filter((a) => a.claimStatus === "UNCLAIMED").length,
      notified: assets.filter((a) => a.claimStatus === "NOTIFIED").length,
      kycVerified: assets.filter((a) => a.claimStatus === "KYC_VERIFIED").length,
      downloaded: assets.filter((a) => a.claimStatus === "DOWNLOADED").length,
      confirmed: assets.filter((a) => a.claimStatus === "CONFIRMED").length,
    };

    res.json({ success: true, assets, verificationRequest: verReq, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
