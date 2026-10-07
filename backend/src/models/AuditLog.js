const mongoose = require("mongoose");
const { AUDIT_ACTIONS } = require("../config/constants");

// BR-007: Immutable audit log - NO update or delete operations ever
const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userEmail: {
      type: String,
    },
    userRole: {
      type: String,
    },
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTIONS),
      required: true,
    },
    targetId: {
      type: String, // flexible — could be vaultId, assetId, userId, etc.
    },
    targetType: {
      type: String, // "Vault" | "DigitalAsset" | "User" | etc.
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Extra contextual info
    },
    // Hash chain for integrity (NFR-003)
    previousHash: {
      type: String,
    },
    entryHash: {
      type: String,
    },
  },
  {
    timestamps: true,
    // Disable versioning to avoid accidental updates
    versionKey: false,
  }
);

// Compound index for queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// ENFORCE IMMUTABILITY: Override save to prevent updates
auditLogSchema.pre("findOneAndUpdate", function () {
  throw new Error("AuditLog records are immutable. Cannot update.");
});
auditLogSchema.pre("updateOne", function () {
  throw new Error("AuditLog records are immutable. Cannot update.");
});
auditLogSchema.pre("updateMany", function () {
  throw new Error("AuditLog records are immutable. Cannot update.");
});
auditLogSchema.pre("findOneAndDelete", function () {
  throw new Error("AuditLog records are immutable. Cannot delete.");
});
auditLogSchema.pre("deleteOne", function () {
  throw new Error("AuditLog records are immutable. Cannot delete.");
});
auditLogSchema.pre("deleteMany", function () {
  throw new Error("AuditLog records are immutable. Cannot delete.");
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
