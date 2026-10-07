const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { loginLimiter, uploadLimiter } = require("../middleware/rateLimiter");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ─── File Upload Config ────────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Chỉ hỗ trợ file PDF, JPG, PNG."), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || "500") * 1024 * 1024 },
});

// ─── Controllers ──────────────────────────────────────────────────
const authCtrl = require("../controllers/authController");
const vaultCtrl = require("../controllers/vaultController");
const assetCtrl = require("../controllers/assetController");
const dmsCtrl = require("../controllers/dmsController");
const executorCtrl = require("../controllers/executorController");
const verifierCtrl = require("../controllers/verifierController");
const beneficiaryCtrl = require("../controllers/beneficiaryController");
const adminCtrl = require("../controllers/adminController");

// ─── Auth Routes ──────────────────────────────────────────────────
/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng ký tài khoản mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [owner, executor, beneficiary, verifier]
 *               phone:
 *                 type: string
 */
router.post("/auth/register", authCtrl.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng nhập
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 */
router.post("/auth/login", loginLimiter, authCtrl.login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Quên mật khẩu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 */
router.post("/auth/forgot-password", authCtrl.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Đặt lại mật khẩu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 */
router.post("/auth/reset-password", authCtrl.resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Lấy thông tin cá nhân
 *     security:
 *       - bearerAuth: []
 */
router.get("/auth/me", auth, authCtrl.getMe);

/**
 * @swagger
 * /auth/me:
 *   put:
 *     tags: [Auth]
 *     summary: Cập nhật thông tin cá nhân
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 */
router.put("/auth/me", auth, authCtrl.updateProfile);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Đổi mật khẩu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 */
router.post("/auth/change-password", auth, authCtrl.changePassword);

// ─── DMS Routes ───────────────────────────────────────────────────
/**
 * @swagger
 * /heartbeat/{token}:
 *   get:
 *     tags: [DMS]
 *     summary: Xác nhận Heartbeat bằng token (qua email)
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/heartbeat/:token", dmsCtrl.heartbeatByToken);

// ─── Vault Owner Routes ───────────────────────────────────────────
/**
 * @swagger
 * /vaults:
 *   get:
 *     tags: [Vaults]
 *     summary: Lấy danh sách kho lưu trữ
 *     security:
 *       - bearerAuth: []
 */
router.get("/vaults", auth, requireRole("owner"), vaultCtrl.listVaults);

/**
 * @swagger
 * /vaults:
 *   post:
 *     tags: [Vaults]
 *     summary: Tạo kho lưu trữ mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vaultName, masterKeySalt, encryptedMasterKey]
 *             properties:
 *               vaultName:
 *                 type: string
 *               description:
 *                 type: string
 *               masterKeySalt:
 *                 type: string
 *               encryptedMasterKey:
 *                 type: string
 */
router.post("/vaults", auth, requireRole("owner"), vaultCtrl.createVault);

/**
 * @swagger
 * /vaults/{id}:
 *   get:
 *     tags: [Vaults]
 *     summary: Lấy thông tin kho lưu trữ
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/vaults/:id", auth, requireRole("owner"), vaultCtrl.getVault);

/**
 * @swagger
 * /vaults/{id}:
 *   put:
 *     tags: [Vaults]
 *     summary: Cập nhật kho lưu trữ
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vaultName:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 */
router.put("/vaults/:id", auth, requireRole("owner"), vaultCtrl.updateVault);

/**
 * @swagger
 * /vaults/{id}:
 *   delete:
 *     tags: [Vaults]
 *     summary: Xóa kho lưu trữ
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete("/vaults/:id", auth, requireRole("owner"), vaultCtrl.deleteVault);

/**
 * @swagger
 * /vaults/{id}/stats:
 *   get:
 *     tags: [Vaults]
 *     summary: Lấy thống kê kho lưu trữ
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/vaults/:id/stats", auth, requireRole("owner"), vaultCtrl.getVaultStats);

/**
 * @swagger
 * /vaults/{id}/executors:
 *   post:
 *     tags: [Vaults]
 *     summary: Chỉ định người thực thi
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [executorEmail]
 *             properties:
 *               executorEmail:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post("/vaults/:id/executors", auth, requireRole("owner"), vaultCtrl.assignExecutor);

/**
 * @swagger
 * /vaults/{id}/executors/{executorId}:
 *   delete:
 *     tags: [Vaults]
 *     summary: Hủy quyền người thực thi
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: executorId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete("/vaults/:id/executors/:executorId", auth, requireRole("owner"), vaultCtrl.revokeExecutor);

// ─── Digital Assets ───────────────────────────────────────────────
/**
 * @swagger
 * /vaults/{vaultId}/assets:
 *   get:
 *     tags: [Assets]
 *     summary: Lấy danh sách tài sản
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vaultId
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/vaults/:vaultId/assets", auth, requireRole("owner"), assetCtrl.listAssets);

/**
 * @swagger
 * /vaults/{vaultId}/assets:
 *   post:
 *     tags: [Assets]
 *     summary: Thêm tài sản mới
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vaultId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [assetName, type, encryptedMetadata]
 *             properties:
 *               assetName:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [crypto, document, credential, physical]
 *               description:
 *                 type: string
 *               encryptedMetadata:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 */
router.post("/vaults/:vaultId/assets", auth, requireRole("owner"), uploadLimiter, upload.single("file"), assetCtrl.createAsset);

/**
 * @swagger
 * /vaults/{vaultId}/assets/{id}:
 *   get:
 *     tags: [Assets]
 *     summary: Lấy thông tin tài sản
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vaultId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/vaults/:vaultId/assets/:id", auth, requireRole("owner"), assetCtrl.getAsset);

/**
 * @swagger
 * /vaults/{vaultId}/assets/{id}:
 *   put:
 *     tags: [Assets]
 *     summary: Cập nhật tài sản
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vaultId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assetName:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               encryptedMetadata:
 *                 type: string
 */
router.put("/vaults/:vaultId/assets/:id", auth, requireRole("owner"), assetCtrl.updateAsset);

/**
 * @swagger
 * /vaults/{vaultId}/assets/{id}:
 *   delete:
 *     tags: [Assets]
 *     summary: Xóa tài sản
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vaultId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete("/vaults/:vaultId/assets/:id", auth, requireRole("owner"), assetCtrl.deleteAsset);

/**
 * @swagger
 * /vaults/{vaultId}/assets/{id}/download:
 *   get:
 *     tags: [Assets]
 *     summary: Tải file tài sản
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vaultId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/vaults/:vaultId/assets/:id/download", auth, requireRole("owner"), assetCtrl.downloadAssetFile);

// ─── Dead Man's Switch (DMS) ──────────────────────────────────────
/**
 * @swagger
 * /vaults/{id}/dms:
 *   get:
 *     tags: [DMS]
 *     summary: Xem cấu hình DMS
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/vaults/:id/dms", auth, requireRole("owner"), dmsCtrl.getDmsConfig);

/**
 * @swagger
 * /vaults/{id}/dms:
 *   put:
 *     tags: [DMS]
 *     summary: Cập nhật cấu hình DMS
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checkIntervalDays:
 *                 type: number
 *               gracePeriodDays:
 *                 type: number
 *               isEnabled:
 *                 type: boolean
 *               notificationChannels:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   sms:
 *                     type: boolean
 */
router.put("/vaults/:id/dms", auth, requireRole("owner"), dmsCtrl.updateDmsConfig);

/**
 * @swagger
 * /vaults/{id}/checkin:
 *   post:
 *     tags: [DMS]
 *     summary: Xác nhận Heartbeat (Điểm danh)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post("/vaults/:id/checkin", auth, requireRole("owner"), dmsCtrl.heartbeatCheckin);

// ─── Executor Routes ──────────────────────────────────────────────
/**
 * @swagger
 * /executor/assignments:
 *   get:
 *     tags: [Executor]
 *     summary: Danh sách kho được giao
 *     security:
 *       - bearerAuth: []
 */
router.get("/executor/assignments", auth, requireRole("executor"), executorCtrl.getAssignments);

/**
 * @swagger
 * /executor/vaults/{vaultId}/assets:
 *   get:
 *     tags: [Executor]
 *     summary: Xem tài sản kho
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vaultId
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/executor/vaults/:vaultId/assets", auth, requireRole("executor"), executorCtrl.getVaultAssets);

/**
 * @swagger
 * /executor/vaults/{vaultId}/submit:
 *   post:
 *     tags: [Executor]
 *     summary: Nộp giấy chứng tử
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vaultId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [deathCertificate]
 *             properties:
 *               deathCertificate:
 *                 type: string
 *                 format: binary
 *               note:
 *                 type: string
 */
router.post("/executor/vaults/:vaultId/submit",
  auth, requireRole("executor"), uploadLimiter,
  upload.single("deathCertificate"),
  executorCtrl.submitVerification
);

/**
 * @swagger
 * /executor/vaults/{vaultId}/progress:
 *   get:
 *     tags: [Executor]
 *     summary: Xem tiến độ xác minh
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vaultId
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/executor/vaults/:vaultId/progress", auth, requireRole("executor"), executorCtrl.getProgress);

// ─── Verifier Routes ──────────────────────────────────────────────
/**
 * @swagger
 * /verifier/requests:
 *   get:
 *     tags: [Verifier]
 *     summary: Lấy danh sách yêu cầu cần xác minh
 *     security:
 *       - bearerAuth: []
 */
router.get("/verifier/requests", auth, requireRole("verifier"), verifierCtrl.getRequests);

/**
 * @swagger
 * /verifier/requests/{id}/take:
 *   post:
 *     tags: [Verifier]
 *     summary: Tiếp nhận yêu cầu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post("/verifier/requests/:id/take", auth, requireRole("verifier"), verifierCtrl.takeRequest);

/**
 * @swagger
 * /verifier/requests/{id}/approve:
 *   post:
 *     tags: [Verifier]
 *     summary: Chấp thuận yêu cầu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 */
router.post("/verifier/requests/:id/approve", auth, requireRole("verifier"), verifierCtrl.approveRequest);

/**
 * @swagger
 * /verifier/requests/{id}/reject:
 *   post:
 *     tags: [Verifier]
 *     summary: Từ chối yêu cầu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 */
router.post("/verifier/requests/:id/reject", auth, requireRole("verifier"), verifierCtrl.rejectRequest);

/**
 * @swagger
 * /verifier/history:
 *   get:
 *     tags: [Verifier]
 *     summary: Xem lịch sử xác minh
 *     security:
 *       - bearerAuth: []
 */
router.get("/verifier/history", auth, requireRole("verifier"), verifierCtrl.getHistory);

// ─── Beneficiary Routes ───────────────────────────────────────────
/**
 * @swagger
 * /beneficiary/assets:
 *   get:
 *     tags: [Beneficiary]
 *     summary: Lấy danh sách tài sản thừa kế
 *     security:
 *       - bearerAuth: []
 */
router.get("/beneficiary/assets", auth, requireRole("beneficiary"), beneficiaryCtrl.getAssets);

/**
 * @swagger
 * /beneficiary/assets/{id}/kyc:
 *   post:
 *     tags: [Beneficiary]
 *     summary: Gửi thông tin KYC (CMND/Selfie)
 *     security:
 *       - bearerAuth: []
 */
router.post("/beneficiary/assets/:id/kyc",
  auth, requireRole("beneficiary"),
  uploadLimiter,
  upload.fields([{ name: "idCard", maxCount: 1 }, { name: "selfie", maxCount: 1 }]),
  beneficiaryCtrl.submitKYC
);

/**
 * @swagger
 * /beneficiary/assets/{id}/claim:
 *   get:
 *     tags: [Beneficiary]
 *     summary: Yêu cầu nhận tài sản
 *     security:
 *       - bearerAuth: []
 */
router.get("/beneficiary/assets/:id/claim", auth, requireRole("beneficiary"), beneficiaryCtrl.claimAsset);

/**
 * @swagger
 * /beneficiary/assets/{id}/confirm:
 *   post:
 *     tags: [Beneficiary]
 *     summary: Xác nhận nhận thành công
 *     security:
 *       - bearerAuth: []
 */
router.post("/beneficiary/assets/:id/confirm", auth, requireRole("beneficiary"), beneficiaryCtrl.confirmAsset);

/**
 * @swagger
 * /beneficiary/assets/{id}/file:
 *   get:
 *     tags: [Beneficiary]
 *     summary: Tải file tài sản thừa kế
 *     security:
 *       - bearerAuth: []
 */
router.get("/beneficiary/assets/:id/file", auth, requireRole("beneficiary"), beneficiaryCtrl.downloadFile);

// ─── Admin Routes ─────────────────────────────────────────────────
/**
 * @swagger
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy thống kê hệ thống
 *     security:
 *       - bearerAuth: []
 */
router.get("/admin/stats", auth, requireRole("admin"), adminCtrl.getStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Quản lý người dùng
 *     security:
 *       - bearerAuth: []
 */
router.get("/admin/users", auth, requireRole("admin"), adminCtrl.listUsers);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     tags: [Admin]
 *     summary: Tạo người dùng mới
 *     security:
 *       - bearerAuth: []
 */
router.post("/admin/users", auth, requireRole("admin"), adminCtrl.createUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật người dùng
 *     security:
 *       - bearerAuth: []
 */
router.put("/admin/users/:id", auth, requireRole("admin"), adminCtrl.updateUser);

/**
 * @swagger
 * /admin/users/{id}/lock:
 *   post:
 *     tags: [Admin]
 *     summary: Khóa tài khoản
 *     security:
 *       - bearerAuth: []
 */
router.post("/admin/users/:id/lock", auth, requireRole("admin"), adminCtrl.lockUser);

/**
 * @swagger
 * /admin/users/{id}/unlock:
 *   post:
 *     tags: [Admin]
 *     summary: Mở khóa tài khoản
 *     security:
 *       - bearerAuth: []
 */
router.post("/admin/users/:id/unlock", auth, requireRole("admin"), adminCtrl.unlockUser);

/**
 * @swagger
 * /admin/audit:
 *   get:
 *     tags: [Admin]
 *     summary: Xem lịch sử hệ thống (Audit Logs)
 *     security:
 *       - bearerAuth: []
 */
router.get("/admin/audit", auth, requireRole("admin"), adminCtrl.getAuditLogs);

/**
 * @swagger
 * /admin/config:
 *   get:
 *     tags: [Admin]
 *     summary: Cấu hình hệ thống
 *     security:
 *       - bearerAuth: []
 */
router.get("/admin/config", auth, requireRole("admin"), adminCtrl.getConfig);

module.exports = router;

