import { useState, useEffect } from "react";
import { adminApi } from "../../lib/api";
import { Container, Card, Alert, Spinner, ListGroup } from "react-bootstrap";

export default function AdminConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getConfig()
      .then((res: any) => setConfig(res.config))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="d-flex justify-content-center py-5">
      <Spinner animation="border" variant="danger" />
    </div>
  );

  return (
    <Container className="py-4" style={{ maxWidth: 800 }}>
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase small fw-bold text-danger">Cấu hình Hệ thống</span>
        </div>
        <h1 className="fw-bold mb-2">Cấu hình Environment</h1>
        <p className="text-muted mb-0">
          FR-024 — Các thông số cấu hình cốt lõi của LegacyVault. Thông số được lấy trực tiếp từ file môi trường trên máy chủ.
        </p>
      </div>

      {config && (
        <Card className="shadow-sm border-0 mb-4">
          <ListGroup variant="flush">
            {[
              { key: "Chu kỳ kiểm tra DMS mặc định", value: `${config.defaultCheckIntervalDays} ngày` },
              { key: "Thời gian ân hạn mặc định", value: `${config.defaultGracePeriodDays} ngày` },
              { key: "Kích thước file tối đa", value: `${config.maxFileSizeMB} MB` },
              { key: "Cron ping sinh tồn", value: config.dmsCronCheck, mono: true },
              { key: "Cron escalation", value: config.dmsCronEscalate, mono: true },
              { key: "Email (SMTP)", value: config.smtpConfigured ? "✅ Đã cấu hình" : "❌ Chưa cấu hình", ok: config.smtpConfigured },
              { key: "FPT.AI eKYC", value: config.ekycConfigured ? "✅ Đã cấu hình" : "⚠️ Đang cấu hình bằng API Backend", ok: config.ekycConfigured },
            ].map((item) => (
              <ListGroup.Item key={item.key} className="d-flex align-items-center justify-content-between p-4">
                <span className="small text-muted fw-bold">{item.key}</span>
                <span className={`small fw-bold ${item.mono ? "font-monospace px-2 py-1 rounded bg-light border" : ""} ${item.ok === false ? "text-danger" : "text-dark"}`}>
                  {item.value}
                </span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}

      <Alert variant="warning" className="d-flex gap-3 shadow-sm border-warning">
        <span className="fs-4">⚙️</span>
        <div className="small text-dark">
          Để thay đổi cấu hình, chỉnh sửa trực tiếp file <code className="bg-white px-2 py-1 rounded border">.env</code> trong thư mục <code className="bg-white px-2 py-1 rounded border">backend/</code> và khởi động lại Node.js Server. Việc thay đổi cấu hình cần có quyền truy cập vật lý vào máy chủ.
        </div>
      </Alert>
    </Container>
  );
}
