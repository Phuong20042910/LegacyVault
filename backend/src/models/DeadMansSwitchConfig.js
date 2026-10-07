const mongoose = require("mongoose");
const { DMS_DEFAULTS } = require("../config/constants");

const deadMansSwitchConfigSchema = new mongoose.Schema(
  {
    vaultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vault",
      required: true,
      unique: true, // 1-1 relationship with vault
    },
    checkIntervalDays: {
      type: Number,
      required: true,
      min: [7, "Chu kỳ tối thiểu 7 ngày"],
      max: [365, "Chu kỳ tối đa 365 ngày"],
      default: DMS_DEFAULTS.CHECK_INTERVAL_DAYS,
    },
    gracePeriodDays: {
      type: Number,
      required: true,
      default: DMS_DEFAULTS.GRACE_PERIOD_DAYS,
    },
    notificationChannels: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    lastCheckInAt: {
      type: Date,
      default: Date.now,
    },
    nextPingDueAt: {
      type: Date,
      required: true,
    },
    graceStartedAt: {
      type: Date,
      default: null,
    },
    consecutiveMisses: {
      type: Number,
      default: 0,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    // One-time token for email heartbeat link
    heartbeatToken: {
      type: String,
      select: false,
    },
    heartbeatTokenExpiresAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for scheduler queries
deadMansSwitchConfigSchema.index({ nextPingDueAt: 1, isEnabled: 1 });

module.exports = mongoose.model("DeadMansSwitchConfig", deadMansSwitchConfigSchema);
