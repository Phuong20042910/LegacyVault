const DigitalAsset = require("../models/DigitalAsset");
const Vault = require("../models/Vault");
const { AUDIT_ACTIONS, VAULT_STATUS } = require("../config/constants");
const path = require("path");
const fs = require("fs");

// GET /api/vaults/:vaultId/assets
exports.listAssets = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.vaultId, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });

    const assets = await DigitalAsset.find({ vaultId: vault._id })
      .populate("assignedBeneficiaryId", "name email")
      .populate("backupBeneficiaryId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, assets });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// POST /api/vaults/:vaultId/assets — Create asset (FR-001, BR-001)
exports.createAsset = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.vaultId, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });
    if (vault.status !== VAULT_STATUS.ACTIVE) {
      return res.status(400).json({ success: false, message: "Kho phải ở trạng thái ACTIVE để thêm tài sản." });
    }

    const { assetCategory, title, encryptedPayload, assignedBeneficiaryId, backupBeneficiaryId, notes } = req.body;
    if (!assetCategory || !title || !encryptedPayload || !assignedBeneficiaryId) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc." });
    }

    // File upload handling
    let fileStoragePath = null;
    let fileOriginalName = null;
    let fileSizeBytes = null;
    if (req.file) {
      const MAX_SIZE = 500 * 1024 * 1024; // 500MB
      if (req.file.size > MAX_SIZE) {
        return res.status(400).json({ success: false, message: "Kích thước tệp đính kèm không được vượt quá 500MB." });
      }
      fileStoragePath = req.file.path;
      fileOriginalName = req.file.originalname;
      fileSizeBytes = req.file.size;
    }

    const asset = await DigitalAsset.create({
      vaultId: vault._id,
      assetCategory,
      title,
      encryptedPayload, // Client already encrypted this (BR-001, Zero-Knowledge)
      fileStoragePath,
      fileOriginalName,
      fileSizeBytes,
      assignedBeneficiaryId,
      backupBeneficiaryId: backupBeneficiaryId || null,
      notes,
    });

    await req.audit(AUDIT_ACTIONS.ASSET_CREATED, asset._id, "DigitalAsset", { title, assetCategory });
    res.status(201).json({ success: true, asset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/vaults/:vaultId/assets/:id
exports.getAsset = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.vaultId, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });

    const asset = await DigitalAsset.findOne({ _id: req.params.id, vaultId: vault._id })
      .populate("assignedBeneficiaryId", "name email phone")
      .populate("backupBeneficiaryId", "name email");
    if (!asset) return res.status(404).json({ success: false, message: "Không tìm thấy tài sản." });

    res.json({ success: true, asset });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// PUT /api/vaults/:vaultId/assets/:id
exports.updateAsset = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.vaultId, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });
    if (vault.status !== VAULT_STATUS.ACTIVE) {
      return res.status(400).json({ success: false, message: "Không thể chỉnh sửa tài sản khi kho không ở trạng thái ACTIVE." });
    }

    const { title, encryptedPayload, assignedBeneficiaryId, backupBeneficiaryId, notes } = req.body;
    const updateData = {};
    if (title) updateData.title = title;
    if (encryptedPayload) updateData.encryptedPayload = encryptedPayload;
    if (assignedBeneficiaryId) updateData.assignedBeneficiaryId = assignedBeneficiaryId;
    if (backupBeneficiaryId !== undefined) updateData.backupBeneficiaryId = backupBeneficiaryId;
    if (notes !== undefined) updateData.notes = notes;

    const asset = await DigitalAsset.findOneAndUpdate(
      { _id: req.params.id, vaultId: vault._id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!asset) return res.status(404).json({ success: false, message: "Không tìm thấy tài sản." });

    await req.audit(AUDIT_ACTIONS.ASSET_UPDATED, asset._id, "DigitalAsset");
    res.json({ success: true, asset });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// DELETE /api/vaults/:vaultId/assets/:id
exports.deleteAsset = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.vaultId, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });
    if (vault.status !== VAULT_STATUS.ACTIVE) {
      return res.status(400).json({ success: false, message: "Không thể xóa tài sản khi kho không ở trạng thái ACTIVE." });
    }

    const asset = await DigitalAsset.findOne({ _id: req.params.id, vaultId: vault._id });
    if (!asset) return res.status(404).json({ success: false, message: "Không tìm thấy tài sản." });

    // Delete associated file if exists
    if (asset.fileStoragePath && fs.existsSync(asset.fileStoragePath)) {
      fs.unlinkSync(asset.fileStoragePath);
    }

    await asset.deleteOne();
    await req.audit(AUDIT_ACTIONS.ASSET_DELETED, req.params.id, "DigitalAsset");
    res.json({ success: true, message: "Đã xóa tài sản." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

// GET /api/vaults/:vaultId/assets/:id/download — Download encrypted file
exports.downloadAssetFile = async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.vaultId, ownerId: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: "Không tìm thấy kho." });

    const asset = await DigitalAsset.findOne({ _id: req.params.id, vaultId: vault._id });
    if (!asset || !asset.fileStoragePath) {
      return res.status(404).json({ success: false, message: "Không có file đính kèm." });
    }
    if (!fs.existsSync(asset.fileStoragePath)) {
      return res.status(404).json({ success: false, message: "File không tồn tại trên máy chủ." });
    }

    await req.audit(AUDIT_ACTIONS.FILE_DOWNLOADED, asset._id, "DigitalAsset");
    res.download(asset.fileStoragePath, asset.fileOriginalName || "encrypted_asset");
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
