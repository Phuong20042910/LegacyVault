const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const FROM = process.env.EMAIL_FROM || "LegacyVault <noreply@legacyvault.vn>";

// ─── Email Templates ───────────────────────────────────────────────

const baseLayout = (content) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f2efe9; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: #0e1829; padding: 24px 32px; }
    .logo { color: #c9a84c; font-size: 20px; font-weight: bold; letter-spacing: 1px; }
    .logo-sub { color: #7a89a8; font-size: 12px; margin-top: 2px; }
    .body { padding: 32px; }
    .footer { background: #f8f7f5; padding: 16px 32px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .btn { display: inline-block; padding: 14px 28px; background: #c9a84c; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .btn-danger { background: #ef4444; }
    .alert { padding: 16px; border-radius: 8px; margin: 16px 0; }
    .alert-warning { background: #fef3c7; border-left: 4px solid #f59e0b; }
    .alert-danger { background: #fee2e2; border-left: 4px solid #ef4444; }
    .text-muted { color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔐 LegacyVault</div>
      <div class="logo-sub">Di sản số bảo mật</div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      Email này được gửi tự động bởi hệ thống LegacyVault. Vui lòng không trả lời.<br>
      © ${new Date().getFullYear()} LegacyVault. Bảo mật theo chuẩn AES-256-GCM.
    </div>
  </div>
</body>
</html>`;

// ─── Send Functions ────────────────────────────────────────────────

/**
 * Send heartbeat ping to owner (FR-007, BR-003)
 */
exports.sendHeartbeatPing = async (owner, vault, dmsConfig, heartbeatToken) => {
  const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const checkinUrl = `${baseUrl}/api/heartbeat/${heartbeatToken}`;
  const daysLeft = Math.ceil(
    (new Date(dmsConfig.nextPingDueAt) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const content = `
    <h2 style="color:#1f2937;">⚠️ Kiểm tra sinh tồn định kỳ</h2>
    <p>Xin chào <strong>${owner.name}</strong>,</p>
    <p>Hệ thống LegacyVault cần xác nhận bạn vẫn đang hoạt động để duy trì kho di sản số <strong>"${vault.vaultName}"</strong>.</p>
    <div class="alert alert-warning">
      <strong>⏰ Hạn chót:</strong> ${new Date(dmsConfig.nextPingDueAt).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })}
      (còn <strong>${daysLeft} ngày</strong>)
    </div>
    <p>Nhấn nút bên dưới để xác nhận bạn vẫn ổn:</p>
    <a href="${checkinUrl}" class="btn">✅ Tôi vẫn ổn — Xác nhận ngay</a>
    <p class="text-muted">Hoặc đăng nhập vào dashboard và nhấn "Xác nhận sinh tồn".<br>Nếu không phản hồi trong thời gian quy định, hệ thống sẽ kích hoạt giai đoạn ân hạn 14 ngày.</p>
  `;

  try {
    await getTransporter().sendMail({
      from: FROM,
      to: owner.email,
      subject: `[LegacyVault] ⚠️ Kiểm tra sinh tồn — Kho "${vault.vaultName}"`,
      html: baseLayout(content),
    });
    console.log(`[Email] Heartbeat ping sent to ${owner.email}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send heartbeat:", err.message);
    return false;
  }
};

/**
 * Send grace period warning (escalation before PENDING_VERIFICATION)
 */
exports.sendGracePeriodWarning = async (owner, vault, daysRemaining) => {
  const isUrgent = daysRemaining <= 2;
  const content = `
    <h2 style="color:#dc2626;">🚨 CẢNH BÁO KHẨN CẤP — Giai đoạn ân hạn</h2>
    <p>Xin chào <strong>${owner.name}</strong>,</p>
    <p>Kho di sản số <strong>"${vault.vaultName}"</strong> đang ở giai đoạn ân hạn.</p>
    <div class="alert alert-danger">
      <strong>Còn lại: ${daysRemaining} ngày</strong> trước khi hệ thống chuyển kho sang trạng thái xác minh pháp lý và thông báo đến Người thi hành di chúc.
    </div>
    ${isUrgent ? `<p><strong>🆘 ĐÂY LÀ CẢNH BÁO KHẨN CẤP TRONG 48 GIỜ CUỐI!</strong></p>` : ""}
    <p>Nếu bạn vẫn đang hoạt động, hãy đăng nhập ngay và xác nhận:</p>
    <a href="${process.env.FRONTEND_URL || "http://localhost:8443"}/owner" class="btn btn-danger">🔐 Đăng nhập và Xác nhận ngay</a>
    <p class="text-muted">Nếu bạn không thể truy cập, hãy liên hệ hỗ trợ kỹ thuật: ${process.env.SMTP_USER}</p>
  `;

  try {
    await getTransporter().sendMail({
      from: FROM,
      to: owner.email,
      subject: `[LegacyVault] 🚨 KHẨN — Còn ${daysRemaining} ngày ân hạn cho kho "${vault.vaultName}"`,
      html: baseLayout(content),
    });
    return true;
  } catch (err) {
    console.error("[Email] Failed to send grace warning:", err.message);
    return false;
  }
};

/**
 * Notify executor when vault moves to PENDING_VERIFICATION (FR-009)
 */
exports.sendExecutorActivationNotice = async (executor, owner, vault) => {
  const content = `
    <h2 style="color:#1f2937;">📋 Thông báo kích hoạt ủy quyền</h2>
    <p>Xin chào <strong>${executor.name}</strong>,</p>
    <p>Hệ thống LegacyVault thông báo rằng kho di sản số của <strong>${owner.name}</strong> (${owner.email}) đã chuyển sang trạng thái <strong>Chờ xác minh pháp lý</strong>.</p>
    <p>Với tư cách là Người thi hành di chúc được ủy quyền, bạn cần:</p>
    <ol>
      <li>Đăng nhập vào hệ thống LegacyVault</li>
      <li>Chuẩn bị và tải lên Giấy chứng tử (Death Certificate)</li>
      <li>Gửi yêu cầu thẩm định đến Người xác minh pháp lý</li>
    </ol>
    <a href="${process.env.FRONTEND_URL || "http://localhost:8443"}/executor" class="btn">📂 Truy cập Portal Người thi hành</a>
    <p class="text-muted">Tên kho: <strong>${vault.vaultName}</strong></p>
  `;

  try {
    await getTransporter().sendMail({
      from: FROM,
      to: executor.email,
      subject: `[LegacyVault] 📋 Yêu cầu hành động — Kho di sản của ${owner.name}`,
      html: baseLayout(content),
    });
    return true;
  } catch (err) {
    console.error("[Email] Failed to send executor notice:", err.message);
    return false;
  }
};

/**
 * Notify beneficiary when vault is UNLOCKED (FR-018)
 */
exports.sendBeneficiaryNotification = async (beneficiary, vault) => {
  const content = `
    <h2 style="color:#1f2937;">🎁 Thông báo thừa kế tài sản số</h2>
    <p>Xin chào <strong>${beneficiary.name}</strong>,</p>
    <p>Bạn được thông báo rằng có tài sản kỹ thuật số được chỉ định cho bạn từ kho <strong>"${vault.vaultName}"</strong> đã được mở khóa.</p>
    <p>Để nhận tài sản, bạn cần:</p>
    <ol>
      <li>Đăng nhập vào hệ thống LegacyVault với tài khoản này</li>
      <li>Hoàn thành xác thực danh tính eKYC (CCCD + Khuôn mặt)</li>
      <li>Tải xuống và giải mã tài sản được phân bổ cho bạn</li>
    </ol>
    <a href="${process.env.FRONTEND_URL || "http://localhost:8443"}/beneficiary" class="btn">🔓 Nhận tài sản thừa kế</a>
    <p class="text-muted">Lưu ý: Tài sản được mã hóa end-to-end và chỉ bạn mới có thể giải mã.</p>
  `;

  try {
    await getTransporter().sendMail({
      from: FROM,
      to: beneficiary.email,
      subject: `[LegacyVault] 🔓 Bạn có tài sản thừa kế đang chờ nhận`,
      html: baseLayout(content),
    });
    return true;
  } catch (err) {
    console.error("[Email] Failed to send beneficiary notification:", err.message);
    return false;
  }
};
