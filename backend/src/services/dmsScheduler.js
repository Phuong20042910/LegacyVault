const cron = require("node-cron");
const Vault = require("../models/Vault");
const DeadMansSwitchConfig = require("../models/DeadMansSwitchConfig");
const ExecutorAssignment = require("../models/ExecutorAssignment");
const User = require("../models/User");
const emailService = require("./emailService");
const { createAuditLog } = require("../middleware/auditLogger");
const { VAULT_STATUS, AUDIT_ACTIONS, DMS_DEFAULTS } = require("../config/constants");
const crypto = require("crypto");

/**
 * Job 1 (FR-007): Scan for vaults due for heartbeat ping.
 * Runs every hour. Sends ping email to owners.
 */
const runHeartbeatPingJob = async () => {
  console.log("[DMS] 🔍 Running heartbeat ping job...");
  const now = new Date();

  try {
    // Find DMS configs where nextPingDueAt has passed and vault is ACTIVE
    const overdueConfigs = await DeadMansSwitchConfig.find({
      isEnabled: true,
      nextPingDueAt: { $lte: now },
    }).populate({
      path: "vaultId",
      match: { status: VAULT_STATUS.ACTIVE },
      populate: { path: "ownerId", select: "name email" },
    });

    let pinged = 0;
    for (const config of overdueConfigs) {
      if (!config.vaultId || !config.vaultId.ownerId) continue;

      const vault = config.vaultId;
      const owner = vault.ownerId;

      // Generate one-time heartbeat token (valid for 48 hours)
      const token = crypto.randomBytes(32).toString("hex");
      config.heartbeatToken = token;
      config.heartbeatTokenExpiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      // Transition to GRACE_PERIOD
      if (vault.status === VAULT_STATUS.ACTIVE) {
        vault.status = VAULT_STATUS.GRACE_PERIOD;
        vault.save();
        config.graceStartedAt = now;
        config.consecutiveMisses = (config.consecutiveMisses || 0) + 1;
      }
      await config.save();

      // Send ping email
      await emailService.sendHeartbeatPing(owner, vault, config, token);

      await createAuditLog({
        userId: owner._id,
        action: AUDIT_ACTIONS.DMS_PING_SENT,
        targetId: vault._id,
        targetType: "Vault",
        metadata: { consecutiveMisses: config.consecutiveMisses },
      });

      pinged++;
    }

    console.log(`[DMS] ✅ Heartbeat ping job: ${pinged} vault(s) pinged.`);
  } catch (err) {
    console.error("[DMS] ❌ Heartbeat ping job error:", err.message);
  }
};

/**
 * Job 2 (FR-009): Check vaults in GRACE_PERIOD that have exceeded grace time.
 * Runs every 6 hours. Escalates to PENDING_VERIFICATION.
 */
const runEscalationJob = async () => {
  console.log("[DMS] 🚨 Running escalation job...");
  const now = new Date();

  try {
    const graceConfigs = await DeadMansSwitchConfig.find({
      isEnabled: true,
      graceStartedAt: { $ne: null },
    }).populate({
      path: "vaultId",
      match: { status: VAULT_STATUS.GRACE_PERIOD },
      populate: { path: "ownerId", select: "name email" },
    });

    let escalated = 0;
    let warned = 0;

    for (const config of graceConfigs) {
      if (!config.vaultId || !config.vaultId.ownerId) continue;

      const vault = config.vaultId;
      const owner = vault.ownerId;
      const graceStart = new Date(config.graceStartedAt);
      const graceEndAt = new Date(graceStart);
      graceEndAt.setDate(graceEndAt.getDate() + config.gracePeriodDays);

      const daysIntoGrace = Math.floor((now - graceStart) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((graceEndAt - now) / (1000 * 60 * 60 * 24));

      if (now >= graceEndAt) {
        // Grace period expired — escalate to PENDING_VERIFICATION (FR-009)
        vault.status = VAULT_STATUS.PENDING_VERIFICATION;
        await vault.save();

        // Notify all active executors
        const assignments = await ExecutorAssignment.find({
          vaultId: vault._id,
          status: "ACTIVE",
        }).populate("executorId", "name email");

        for (const assignment of assignments) {
          if (assignment.executorId) {
            await emailService.sendExecutorActivationNotice(assignment.executorId, owner, vault);
          }
        }

        await createAuditLog({
          userId: owner._id,
          action: AUDIT_ACTIONS.DMS_ESCALATED,
          targetId: vault._id,
          targetType: "Vault",
          metadata: { daysIntoGrace, executorsNotified: assignments.length },
        });

        escalated++;
      } else {
        // Send warning emails on days 1, 7, 12, and last 48h (BR-003)
        const warningDays = DMS_DEFAULTS.WARNING_DAYS;
        if (warningDays.includes(daysIntoGrace) || daysRemaining <= 2) {
          await emailService.sendGracePeriodWarning(owner, vault, daysRemaining);
          warned++;
        }
      }
    }

    console.log(`[DMS] ✅ Escalation job: ${escalated} escalated, ${warned} warnings sent.`);
  } catch (err) {
    console.error("[DMS] ❌ Escalation job error:", err.message);
  }
};

/**
 * Initialize all cron jobs
 */
const initDmsScheduler = () => {
  const pingCron = process.env.DMS_CRON_CHECK || "0 * * * *";       // Every hour
  const escalateCron = process.env.DMS_CRON_ESCALATE || "0 */6 * * *"; // Every 6 hours

  cron.schedule(pingCron, runHeartbeatPingJob, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  });

  cron.schedule(escalateCron, runEscalationJob, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  });

  console.log(`[DMS] 🟢 Scheduler initialized — Ping: "${pingCron}", Escalate: "${escalateCron}"`);
};

module.exports = { initDmsScheduler, runHeartbeatPingJob, runEscalationJob };
