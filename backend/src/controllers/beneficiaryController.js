const DigitalAsset = require("../models/DigitalAsset");
const Vault = require("../models/Vault");
const ekycService = require("../services/ekyc.service");
const { AUDIT_ACTIONS, VAULT_STATUS, CLAIM_STATUS } = require("../config/constants");
const path = require("path");
const fs = require("fs");

// GET /api/beneficiary/assets — List inherited assets (FR-019 gate)
exports.getAssets = async (req, res) => {
  try {
    const assets = await DigitalAsset.find({ assignedBeneficiaryId: req.user._id })
      .populate({
        path: "vaultId",
        select: "vaultName status ownerId",
        populate: { path: "ownerId", select: "name" },
      })
      .sort({ createdAt: -1 });

    // Only return assets from UNLOCKED vaults
    const accessible = assets.filter(
      (a) => a.vaultId && a.vaultId.status === VAULT_STATUS.UNLOCKED
    );

    // Hide encryptedPayload for non-KYC-verified assets (BR-006)
    const result = accessible.map((a) => {
      const obj = a.toJSON();
      if (obj.claimStatus !== CLAIM_STATUS.KYC_VERIFIED &&
          obj.claimStatus !== CLAIM_STATUS.DOWNLOADED &&
          obj.claimStatus !== CLAIM_STATUS.CONFIRMED) {
        delete obj.encryptedPayload;
      }
      return obj;
    });

    res.json({ success: true, assets: result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/beneficiary/assets/:id/kyc — Submit eKYC (FR-019, BR-006)
exports.submitKYC = async (req, res) => {
  try {
    const asset = await DigitalAsset.findOne({
      _id: req.params.id,
      assignedBeneficiaryId: req.user._id,
    }).populate("vaultId", "status");

    if (!asset) return res.status(404).json({ success: false, message: "Không tìm thấy tài sản." });
    if (asset.vaultId.status !== VAULT_STATUS.UNLOCKED) {
      return res.status(403).json({ success: false, message: "Kho chưa được mở khóa." });
    }
    if (asset.claimStatus === CLAIM_STATUS.KYC_VERIFIED ||
        asset.claimStatus === CLAIM_STATUS.DOWNLOADED ||
        asset.claimStatus === CLAIM_STATUS.CONFIRMED) {
      return res.status(400).json({ success: false, message: "Danh tính đã được xác thực." });
    }

    if (!req.files || !req.files.idCard || !req.files.selfie) {
      return res.status(400).json({ success: false, message: "Yêu cầu ảnh CCCD/Hộ chiếu và ảnh selfie." });
    }

    const MAX_KYC_SIZE = 10 * 1024 * 1024; // 10MB
    if (req.files.idCard[0].size > MAX_KYC_SIZE || req.files.selfie[0].size > MAX_KYC_SIZE) {
      return res.status(400).json({ success: false, message: "Kích thước ảnh eKYC không được vượt quá 10MB mỗi tệp." });
    }

    // Call FPT.AI eKYC service
    const kycResult = await ekycService.verifyIdentity({
      idCardPath: req.files.idCard[0].path,
      selfiePath: req.files.selfie[0].path,
      nationalId: req.user.nationalId,
    });

    // Clean up temp files
    [req.files.idCard[0].path, req.files.selfie[0].path].forEach((fp) => {
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    });

    if (!kycResult.success) {
      await req.audit(AUDIT_ACTIONS.KYC_SUBMITTED, asset._id, "DigitalAsset", { result: "failed", reason: kycResult.message });
      return res.status(400).json({ success: false, message: `Xác thực danh tính thất bại: ${kycResult.message}` });
    }

    asset.claimStatus = CLAIM_STATUS.KYC_VERIFIED;
    asset.kycVerifiedAt = new Date();
    await asset.save();

    await req.audit(AUDIT_ACTIONS.KYC_APPROVED, asset._id, "DigitalAsset", { similarity: kycResult.similarity });

    res.json({
      success: true,
      message: "Xác thực danh tính thành công! Bạn có thể truy cập tài sản.",
      claimStatus: asset.claimStatus,
    });
  } catch (err) {
    console.error("KYC error:", err);
    res.status(500).json({ success: false, message: "Lỗi xác thực danh tính." });
  }
};

// GET /api/beneficiary/assets/:id/claim — Retrieve decryption key (FR-020)
// Gate: BR-006 — must have passed eKYC first
exports.claimAsset = async (req, res) => {
  try {
    const asset = await DigitalAsset.findOne({
      _id: req.params.id,
      assignedBeneficiaryId: req.user._id,
    }).populate("vaultId", "status encryptedMasterKey masterKeySalt");

    if (!asset) return res.status(404).json({ success: false, message: "Không tìm thấy tài sản." });

    if (asset.vaultId.status !== VAULT_STATUS.UNLOCKED) {
      return res.status(403).json({ success: false, message: "Kho chưa được mở khóa." });
    }

    // BR-006 enforcement: TC-KYC-01
    if (asset.claimStatus !== CLAIM_STATUS.KYC_VERIFIED &&
        asset.claimStatus !== CLAIM_STATUS.DOWNLOADED &&
        asset.claimStatus !== CLAIM_STATUS.CONFIRMED) {
      return res.status(403).json({
        success: false,
        message: "Bạn chưa hoàn thành xác thực danh tính eKYC. Vui lòng xác thực trước.",
        requireKYC: true,
      });
    }

    // Update status
    if (asset.claimStatus === CLAIM_STATUS.KYC_VERIFIED) {
      asset.claimStatus = CLAIM_STATUS.DOWNLOADED;
      asset.downloadedAt = new Date();
      await asset.save();
    }

    await req.audit(AUDIT_ACTIONS.ASSET_CLAIMED, asset._id, "DigitalAsset", { assetId: asset._id });

    // Return encrypted payload + vault key material (client decrypts locally — BR-001)
    res.json({
      success: true,
      asset: {
        id: asset._id,
        title: asset.title,
        assetCategory: asset.assetCategory,
        encryptedPayload: asset.encryptedPayload,
        fileStoragePath: asset.fileStoragePath ? `/api/beneficiary/assets/${asset._id}/file` : null,
        claimStatus: asset.claimStatus,
      },
      // Encrypted master key — client uses password-derived key to decrypt this,
      // then uses master key to decrypt encryptedPayload
      vaultKeyMaterial: {
        encryptedMasterKey: asset.vaultId.encryptedMasterKey,
        masterKeySalt: asset.vaultId.masterKeySalt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/beneficiary/assets/:id/confirm — Confirm receipt (FR-021)
exports.confirmAsset = async (req, res) => {
  try {
    const asset = await DigitalAsset.findOne({
      _id: req.params.id,
      assignedBeneficiaryId: req.user._id,
    }).populate("vaultId");

    if (!asset) return res.status(404).json({ success: false, message: "Không tìm thấy tài sản." });
    if (asset.claimStatus !== CLAIM_STATUS.DOWNLOADED) {
      return res.status(400).json({ success: false, message: "Bạn cần tải tài sản trước khi xác nhận." });
    }

    asset.claimStatus = CLAIM_STATUS.CONFIRMED;
    asset.confirmedAt = new Date();
    await asset.save();

    await req.audit(AUDIT_ACTIONS.ASSET_CONFIRMED, asset._id, "DigitalAsset");

    // Check if all assets in vault are confirmed → close vault (FR-021, BR-008)
    const allAssets = await DigitalAsset.find({ vaultId: asset.vaultId._id });
    const allConfirmed = allAssets.every((a) => a.claimStatus === CLAIM_STATUS.CONFIRMED);
    if (allConfirmed) {
      await Vault.findByIdAndUpdate(asset.vaultId._id, {
        status: VAULT_STATUS.CLOSED,
        closedAt: new Date(),
        secureEraseAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      });
      await req.audit(AUDIT_ACTIONS.VAULT_CLOSED, asset.vaultId._id, "Vault");
    }

    res.json({ success: true, message: "Đã xác nhận nhận tài sản.", claimStatus: asset.claimStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/beneficiary/assets/:id/file — Download encrypted file
exports.downloadFile = async (req, res) => {
  try {
    const asset = await DigitalAsset.findOne({
      _id: req.params.id,
      assignedBeneficiaryId: req.user._id,
    });
    if (!asset) return res.status(404).json({ success: false, message: "Không tìm thấy tài sản." });
    if (![CLAIM_STATUS.KYC_VERIFIED, CLAIM_STATUS.DOWNLOADED, CLAIM_STATUS.CONFIRMED].includes(asset.claimStatus)) {
      return res.status(403).json({ success: false, message: "Chưa xác thực danh tính." });
    }
    if (!asset.fileStoragePath) {
      return res.status(404).json({ success: false, message: "Không có file đính kèm." });
    }

    await req.audit(AUDIT_ACTIONS.FILE_DOWNLOADED, asset._id, "DigitalAsset");
    res.download(asset.fileStoragePath, asset.fileOriginalName || "encrypted_file");
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
