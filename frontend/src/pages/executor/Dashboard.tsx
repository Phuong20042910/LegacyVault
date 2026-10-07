import { useState, useEffect } from "react";
import { Link } from "react-router";
import { executorApi } from "../../lib/api";
import { Container, Row, Col, Card, Badge, Alert, Spinner, Button } from "react-bootstrap";

interface Assignment {
  assignmentId: string;
  vault: {
    id: string;
    name: string;
    status: string;
    owner: { name: string; email: string; phone?: string };
    assetCount: number;
  };
  verificationStatus: string | null;
  invitedAt: string;
}

const VAULT_STATUS_LABELS: Record<string, { label: string; bg: string }> = {
  ACTIVE: { label: "Hoạt động bình thường", bg: "success" },
  GRACE_PERIOD: { label: "Đang trong thời gian Ân hạn", bg: "warning" },
  PENDING_VERIFICATION: { label: "Chờ xác minh pháp lý", bg: "danger" },
  UNLOCKED: { label: "Kho đã Mở khóa", bg: "info" },
  CLOSED: { label: "Kho đã Đóng", bg: "secondary" },
};

const VER_STATUS: Record<string, { label: string; bg: string }> = {
  SUBMITTED: { label: "Đã nộp hồ sơ", bg: "info" },
  IN_REVIEW: { label: "Đang xét duyệt", bg: "warning" },
  APPROVED: { label: "Đã phê duyệt ✓", bg: "success" },
  REJECTED: { label: "Bị từ chối ✕", bg: "danger" },
};

export default function ExecutorDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    executorApi
      .getAssignments()
      .then((res: any) => setAssignments(res.assignments || []))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const pendingAction = assignments.filter(
    (a) => a.vault.status === "PENDING_VERIFICATION" && !a.verificationStatus
  );

  if (loading) return (
    <div className="d-flex justify-content-center py-5">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  return (
    <Container className="py-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase text-primary small fw-bold">Khu vực Người thi hành di chúc</span>
        </div>
        <h1 className="fw-bold mb-2">Tổng quan Nhiệm vụ</h1>
        <p className="text-muted mb-0">
          Quản lý danh sách các kho di sản được ủy quyền. Hệ thống sẽ tự động kích hoạt và gửi cảnh báo khi cần sự can thiệp từ bạn.
        </p>
      </div>

      {/* Stats */}
      <Row className="g-4 mb-4">
        {[
          { title: "Kho được ủy quyền", value: assignments.length, icon: "🗄️", text: "primary", bg: "primary" },
          { title: "Cần hành động", value: pendingAction.length, icon: "🚨", text: pendingAction.length > 0 ? "danger" : "secondary", bg: pendingAction.length > 0 ? "danger" : "secondary" },
          { title: "Đã phê duyệt", value: assignments.filter((a) => a.verificationStatus === "APPROVED").length, icon: "✅", text: "success", bg: "success" },
        ].map((s) => (
          <Col xs={12} sm={4} key={s.title}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="d-flex align-items-center gap-3 p-4">
                <div className={`bg-${s.bg} bg-opacity-10 text-${s.text} rounded d-flex align-items-center justify-content-center fs-3 flex-shrink-0`} style={{ width: 64, height: 64 }}>
                  {s.icon}
                </div>
                <div>
                  <h2 className={`fw-bold mb-1 text-${s.text}`}>{s.value}</h2>
                  <div className="text-muted font-monospace small text-uppercase">{s.title}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {pendingAction.length > 0 && (
        <Alert variant="danger" className="d-flex flex-column flex-md-row align-items-md-center gap-3 shadow-sm border border-danger mb-4 p-4">
          <div className="fs-1 flex-shrink-0">🚨</div>
          <div className="flex-grow-1">
            <h5 className="fw-bold mb-1 text-danger">Phát hiện {pendingAction.length} sự kiện Khẩn cấp cần xử lý!</h5>
            <p className="mb-0 text-dark">
              Các kho lưu trữ này đã bước vào trạng thái <strong>PENDING_VERIFICATION</strong> (Chủ kho không phản hồi điểm danh). Bạn cần chuẩn bị hồ sơ chứng tử và nộp lên hệ thống ngay lập tức để thực hiện thủ tục mở khóa.
            </p>
          </div>
          <Link to="/executor/verification" className="btn btn-danger fw-bold flex-shrink-0 px-4 py-2">
            NỘP HỒ SƠ NGAY →
          </Link>
        </Alert>
      )}

      {error && <Alert variant="danger">⚠️ {error}</Alert>}

      <div className="d-flex flex-column gap-3">
        {assignments.length === 0 ? (
          <Card className="text-center py-5 border-dashed bg-light shadow-sm">
            <Card.Body className="d-flex flex-column align-items-center">
              <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80, fontSize: 40 }}>
                📋
              </div>
              <Card.Title className="fw-bold fs-4 mb-2">Chưa có nhiệm vụ</Card.Title>
              <Card.Text className="text-muted">
                Bạn chưa được ủy quyền cho kho lưu trữ nào. Hệ thống sẽ gửi thông báo qua email khi có Chủ kho chỉ định bạn.
              </Card.Text>
            </Card.Body>
          </Card>
        ) : (
          assignments.map((a) => {
            const sc = VAULT_STATUS_LABELS[a.vault.status] || VAULT_STATUS_LABELS.ACTIVE;
            const vs = a.verificationStatus ? VER_STATUS[a.verificationStatus] : null;
            
            return (
              <Card key={a.assignmentId} className="shadow-sm border-0">
                <Card.Body className="p-4 d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-4">
                  <div className="flex-grow-1">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                      <h4 className="fw-bold mb-0 me-2">{a.vault.name}</h4>
                      <Badge bg={sc.bg} className="font-monospace fw-normal">{sc.label}</Badge>
                      {vs && <Badge bg={vs.bg} className="font-monospace fw-normal">{vs.label}</Badge>}
                    </div>
                    
                    <Row className="g-3">
                      <Col xs={12} sm={4}>
                        <div className="text-muted font-monospace small text-uppercase mb-1">Chủ sở hữu</div>
                        <div className="fw-bold d-flex align-items-center gap-2">
                          👑 {a.vault.owner?.name}
                        </div>
                        <div className="text-muted small">{a.vault.owner?.email}</div>
                      </Col>
                      <Col xs={12} sm={4}>
                        <div className="text-muted font-monospace small text-uppercase mb-1">Quy mô tài sản</div>
                        <div className="fw-bold d-flex align-items-center gap-2">
                          💎 {a.vault.assetCount} mục mã hóa
                        </div>
                      </Col>
                      <Col xs={12} sm={4}>
                        <div className="text-muted font-monospace small text-uppercase mb-1">Ngày nhận ủy quyền</div>
                        <div className="fw-bold text-muted d-flex align-items-center gap-2">
                          📅 {new Date(a.invitedAt).toLocaleDateString("vi-VN")}
                        </div>
                      </Col>
                    </Row>
                  </div>
                  
                  {a.vault.status === "PENDING_VERIFICATION" && !a.verificationStatus && (
                    <div className="d-flex align-items-center justify-content-center flex-shrink-0 pt-3 pt-md-0 ps-md-4 border-top border-md-top-0 border-md-start">
                      <Link to="/executor/verification" className="btn btn-danger fw-bold w-100">
                        NỘP HỒ SƠ →
                      </Link>
                    </div>
                  )}
                  {a.vault.status === "UNLOCKED" && (
                    <div className="d-flex flex-column align-items-center justify-content-center flex-shrink-0 pt-3 pt-md-0 ps-md-4 border-top border-md-top-0 border-md-start gap-2">
                      <span className="text-success font-monospace small fw-bold text-uppercase">ĐÃ MỞ KHÓA THÀNH CÔNG</span>
                      <Link to="/executor/assets" className="btn btn-outline-primary fw-bold w-100">
                        TIẾN HÀNH PHÂN BỔ →
                      </Link>
                    </div>
                  )}
                </Card.Body>
              </Card>
            );
          })
        )}
      </div>
    </Container>
  );
}
