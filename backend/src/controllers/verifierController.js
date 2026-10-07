const VerificationRequest = require("../models/VerificationRequest");
const Vault = require("../models/Vault");
const DigitalAsset = require("../models/DigitalAsset");
const emailService = require("../services/emailService");
const { AUDIT_ACTIONS, VAULT_STATUS, VERIFICATION_STATUS, CLAIM_STATUS } = require("../config/constants");
const crypto = require("crypto");

// GET /api/verifier/requests — Pending requests assigned to this verifier
exports.getRequests = async (req, res) => {
  try {
    const requests = await VerificationRequest.find({
      $or: [
        { verifierId: req.user._id },
        { verifierId: null, status: VERIFICATION_STATUS.SUBMITTED },
      ],
    })
      .populate("vaultId", "vaultName status ownerId")
      .populate("executorId", "name email phone")
      .populate("verifierId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/verifier/requests/:id/take — Take a case for review
exports.takeRequest = async (req, res) => {
  try {
    const verReq = await VerificationRequest.findById(req.params.id);
    if (!verReq) return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ." });
    if (verReq.status !== VERIFICATION_STATUS.SUBMITTED) {
      return res.status(400).json({ success: false, message: "Hồ sơ này đã được tiếp nhận hoặc đã xử lý." });
    }

    verReq.verifierId = req.user._id;
    verReq.status = VERIFICATION_STATUS.IN_REVIEW;
    verReq.reviewStartedAt = new Date();
    await verReq.save();

    res.json({ success: true, request: verReq });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/verifier/requests/:id/approve — Approve and sign (FR-014, FR-016, BR-005)
exports.approveRequest = async (req, res) => {
  try {
    const verReq = await VerificationRequest.findById(req.params.id);
    if (!verReq) return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ." });

    if (verReq.status !== VERIFICATION_STATUS.IN_REVIEW) {
      return res.status(400).json({ success: false, message: "Hồ sơ phải ở trạng thái IN_REVIEW để phê duyệt." });
    }
    if (String(verReq.verifierId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Bạn không phải người phụ trách hồ sơ này." });
    }

    // Generate digital signature (simplified — in production use RSA/ECDSA private key)
    const signaturePayload = JSON.stringify({
      verifierId: req.user._id,
      verifierEmail: req.user.email,
      vaultId: verReq.vaultId,
      requestId: verReq._id,
      decision: "APPROVED",
      timestamp: new Date().toISOString(),
    });
    const verifierSignature = crypto
      .createHmac("sha256", process.env.JWT_SECRET)
      .update(signaturePayload)
      .digest("hex");

    verReq.status = VERIFICATION_STATUS.APPROVED;
    verReq.verifierSignature = `v1.${verifierSignature}`;
    verReq.verifierNotes = req.body.notes || "";
    verReq.reviewedAt = new Date();
    await verReq.save();

    // Transition vault to UNLOCKED (BR-005, FR-016)
    const vault = await Vault.findByIdAndUpdate(
      verReq.vaultId,
      { status: VAULT_STATUS.UNLOCKED },
      { new: true }
    );

    // Notify beneficiaries (FR-018)
    const assets = await DigitalAsset.find({ vaultId: vault._id })
      .populate("assignedBeneficiaryId", "name email");

    const notifiedEmails = new Set();
    for (const asset of assets) {
      if (asset.assignedBeneficiaryId && !notifiedEmails.has(asset.assignedBeneficiaryId.email)) {
        await emailService.sendBeneficiaryNotification(
          asset.assignedBeneficiaryId,
          vault
        );
        notifiedEmails.add(asset.assignedBeneficiaryId.email);
        asset.claimStatus = CLAIM_STATUS.NOTIFIED;
        await asset.save();
      }
    }

    await req.audit(AUDIT_ACTIONS.VERIFICATION_APPROVED, verReq._id, "VerificationRequest", {
      vaultId: vault._id,
      signature: verReq.verifierSignature,
    });
    await req.audit(AUDIT_ACTIONS.VAULT_UNLOCKED, vault._id, "Vault");

    res.json({
      success: true,
      message: "Đã phê duyệt và mở khóa kho. Người thụ hưởng đã được thông báo.",
      verificationRequest: verReq,
      vaultStatus: vault.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/verifier/requests/:id/reject — Reject with reason (FR-014)
exports.rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: "Lý do từ chối là bắt buộc." });
    }

    const verReq = await VerificationRequest.findById(req.params.id);
    if (!verReq) return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ." });
    if (verReq.status !== VERIFICATION_STATUS.IN_REVIEW) {
      return res.status(400).json({ success: false, message: "Hồ sơ phải ở trạng thái IN_REVIEW để từ chối." });
    }
    if (String(verReq.verifierId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Bạn không phải người phụ trách hồ sơ này." });
    }

    verReq.status = VERIFICATION_STATUS.REJECTED;
    verReq.rejectionReason = reason;
    verReq.reviewedAt = new Date();
    await verReq.save();

    await req.audit(AUDIT_ACTIONS.VERIFICATION_REJECTED, verReq._id, "VerificationRequest", { reason });

    res.json({ success: true, message: "Đã từ chối hồ sơ.", verificationRequest: verReq });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/verifier/history — Verifier's reviewed history (FR-017)
exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      VerificationRequest.find({
        verifierId: req.user._id,
        status: { $in: [VERIFICATION_STATUS.APPROVED, VERIFICATION_STATUS.REJECTED] },
      })
        .populate("vaultId", "vaultName")
        .populate("executorId", "name email")
        .sort({ reviewedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      VerificationRequest.countDocuments({
        verifierId: req.user._id,
        status: { $in: [VERIFICATION_STATUS.APPROVED, VERIFICATION_STATUS.REJECTED] },
      }),
    ]);

    res.json({
      success: true,
      requests,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
