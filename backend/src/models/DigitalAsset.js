const mongoose = require("mongoose");
const { ASSET_CATEGORY, CLAIM_STATUS } = require("../config/constants");

const digitalAssetSchema = new mongoose.Schema(
  {
    vaultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vault",
      required: true,
      index: true,
    },
    assetCategory: {
      type: String,
      enum: Object.values(ASSET_CATEGORY),
      required: true,
    },
    title: {
      type: String,
      required: [true, "Tên tài sản không được để trống"],
      trim: true,
      maxlength: [200, "Tên tài sản không quá 200 ký tự"],
    },
    // AES-256-GCM encrypted on client — server stores only ciphertext
    encryptedPayload: {
      type: String,
      required: [true, "Dữ liệu mã hóa không được để trống"],
    },
    // File attachment (already encrypted before upload)
    fileStoragePath: {
      type: String,
      default: null,
    },
    fileOriginalName: {
      type: String,
      default: null,
    },
    fileSizeBytes: {
      type: Number,
      default: null,
    },
    // Beneficiary assignment (BR-002: one primary, one backup)
    assignedBeneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    backupBeneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    claimStatus: {
      type: String,
      enum: Object.values(CLAIM_STATUS),
      default: CLAIM_STATUS.UNCLAIMED,
    },
    kycVerifiedAt: {
      type: Date,
    },
    downloadedAt: {
      type: Date,
    },
    confirmedAt: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: [1000, "Ghi chú không quá 1000 ký tự"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Index for beneficiary lookups
digitalAssetSchema.index({ assignedBeneficiaryId: 1, claimStatus: 1 });

module.exports = mongoose.model("DigitalAsset", digitalAssetSchema);
