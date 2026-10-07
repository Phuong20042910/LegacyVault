const mongoose = require("mongoose");
const { EXECUTOR_STATUS } = require("../config/constants");

const executorAssignmentSchema = new mongoose.Schema(
  {
    vaultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vault",
      required: true,
    },
    executorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EXECUTOR_STATUS),
      default: EXECUTOR_STATUS.ACTIVE,
    },
    // Invitation email tracking
    inviteEmail: {
      type: String,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one active executor per vault (can have multiple but track all)
executorAssignmentSchema.index({ vaultId: 1, executorId: 1 }, { unique: true });

module.exports = mongoose.model("ExecutorAssignment", executorAssignmentSchema);
