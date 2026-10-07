import { Container, Card, Badge, Button } from "react-bootstrap";

const logs = [
  { time: "12/09/2026 09:42", action: "Cập nhật thông tin ví Bitcoin", ip: "192.168.1.5", device: "Chrome / macOS", type: "update" },
  { time: "11/09/2026 16:20", action: "Thêm người thụ hưởng: Lê Anh Tú", ip: "192.168.1.5", device: "Chrome / macOS", type: "add" },
  { time: "11/09/2026 06:00", action: "Kiểm tra Dead Man's Switch — PASS", ip: "System", device: "Tự động", type: "check" },
  { time: "10/09/2026 14:55", action: "Tải lên: Di chúc số v2.1", ip: "192.168.1.5", device: "Chrome / macOS", type: "doc" },
  { time: "09/09/2026 11:30", action: "Đăng nhập thành công · 2FA xác minh", ip: "192.168.1.5", device: "Chrome / macOS", type: "auth" },
  { time: "01/09/2026 20:00", action: "Truy cập bị từ chối · IP lạ phát hiện", ip: "103.44.21.9", device: "Firefox / Windows", type: "alert" },
];

const typeConfig: Record<string, { bg: string; label: string; text?: string }> = {
  update: { bg: "warning", label: "Cập nhật", text: "dark" },
  add:    { bg: "success", label: "Thêm mới" },
  check:  { bg: "info", label: "Kiểm tra", text: "dark" },
  doc:    { bg: "secondary", label: "Tài liệu" },
  auth:   { bg: "primary", label: "Xác thực" },
  alert:  { bg: "danger", label: "Cảnh báo" },
};

export default function OwnerLogs() {
  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="fw-bold mb-1">Nhật ký hoạt động</h1>
        <p className="text-muted mb-0">Lịch sử toàn bộ hoạt động truy cập vào kho lưu trữ</p>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light border-bottom py-3 d-flex justify-content-between align-items-center">
          <div className="font-monospace text-uppercase text-muted" style={{ fontSize: "0.85rem" }}>
            Nhật ký &middot; 30 ngày qua
          </div>
          <Button variant="outline-warning" size="sm" className="fw-bold font-monospace">Xuất CSV</Button>
        </Card.Header>
        <div className="list-group list-group-flush">
          {logs.map((log, i) => {
            const cfg = typeConfig[log.type];
            return (
              <div key={i} className={`list-group-item flex-column align-items-start py-3 border-bottom ${log.type === 'alert' ? 'bg-danger bg-opacity-10' : ''}`}>
                <div className="d-flex w-100 justify-content-between align-items-start gap-3">
                  <div className="d-flex gap-3 align-items-start">
                    <Badge bg={cfg.bg} text={cfg.text || 'white'} className="font-monospace fw-normal py-2 flex-shrink-0" style={{ width: 80 }}>
                      {cfg.label}
                    </Badge>
                    <div>
                      <div className="fw-bold text-dark">{log.action}</div>
                      <div className="font-monospace text-muted small mt-1">
                        {log.ip} &middot; {log.device}
                      </div>
                    </div>
                  </div>
                  <small className="font-monospace text-muted flex-shrink-0 text-end">
                    {log.time}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </Container>
  );
}
