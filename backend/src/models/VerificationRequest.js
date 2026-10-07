const mongoose = require("mongoose");
const { VERIFICATION_STATUS } = require("../config/constants");

const verificationRequestSchema = new mongoose.Schema(
  {
    vaultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vault",
      required: true,
      index: true,
    },
    executorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Death certificate file path (encrypted)
    deathCertificateUrl: {
      type: String,
      required: [true, "Đường dẫn giấy chứng tử là bắt buộc"],
    },
    deathCertificateOriginalName: {
      type: String,
    },
    // Supporting documents
    additionalDocuments: [
      {
        url: String,
        originalName: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // Assigned verifier
    verifierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.SUBMITTED,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    // Digital signature from verifier when approved (BR-005)
    verifierSignature: {
      type: String,
      default: null,
    },
    verifierNotes: {
      type: String,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewStartedAt: {
      type: Date,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("VerificationRequest", verificationRequestSchema);
