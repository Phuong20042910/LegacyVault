const mongoose = require("mongoose");
const { VAULT_STATUS } = require("../config/constants");

const vaultSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vaultName: {
      type: String,
      required: [true, "Tên kho không được để trống"],
      trim: true,
      maxlength: [150, "Tên kho không quá 150 ký tự"],
    },
    status: {
      type: String,
      enum: Object.values(VAULT_STATUS),
      default: VAULT_STATUS.ACTIVE,
      required: true,
    },
    // Zero-knowledge: server never sees plaintext master key
    masterKeySalt: {
      type: String,
      required: true,
    },
    encryptedMasterKey: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      maxlength: [500, "Mô tả không quá 500 ký tự"],
    },
    closedAt: {
      type: Date,
    },
    // Timestamp when legal erase is scheduled (90 days after CLOSED)
    secureEraseAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: deadMansSwitchConfig
vaultSchema.virtual("dmsConfig", {
  ref: "DeadMansSwitchConfig",
  localField: "_id",
  foreignField: "vaultId",
  justOne: true,
});

// Virtual: assets count
vaultSchema.virtual("assets", {
  ref: "DigitalAsset",
  localField: "_id",
  foreignField: "vaultId",
});

module.exports = mongoose.model("Vault", vaultSchema);
