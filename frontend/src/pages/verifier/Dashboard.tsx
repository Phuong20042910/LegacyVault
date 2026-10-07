import { Link } from "react-router";
import { Container, Row, Col, Card, Badge, Button, ListGroup } from "react-bootstrap";

export default function VerifierDashboard() {
  return (
    <Container className="py-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase small fw-bold" style={{ color: "#a855f7" }}>Khu vực Chuyên gia Pháp lý</span>
        </div>
        <h1 className="fw-bold mb-2">Bàn làm việc Điện tử</h1>
        <p className="text-muted mb-0">
          Định danh điện tử (eKYC): <strong className="text-dark">Phạm Quốc Luật</strong> · Công chứng viên<br/>Phòng Công chứng số 4 TP.HCM
        </p>
      </div>
      
      <Row className="g-4 mb-4">
        {[
          { label: "Yêu cầu mới", value: "2", sub: "Cần xem xét", text: "warning", bg: "warning", icon: "📋" },
          { label: "Đã phê duyệt", value: "14", sub: "Tháng này", text: "success", bg: "success", icon: "✅" },
          { label: "Đã từ chối", value: "3", sub: "Tài liệu không hợp lệ", text: "danger", bg: "danger", icon: "✕" },
          { label: "Đang xử lý", value: "1", sub: "Chờ tài liệu bổ sung", text: "info", bg: "info", icon: "⏳" },
        ].map((s, i) => (
          <Col xs={12} sm={6} lg={3} key={i}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="d-flex align-items-center gap-3 p-4">
                <div className={`bg-${s.bg} bg-opacity-10 text-${s.text} rounded d-flex align-items-center justify-content-center fs-3 flex-shrink-0`} style={{ width: 64, height: 64 }}>
                  {s.icon}
                </div>
                <div>
                  <h2 className={`fw-bold mb-1 text-${s.text}`}>{s.value}</h2>
                  <div className="text-muted font-monospace small text-uppercase">{s.label}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <div className="font-monospace text-uppercase small fw-bold text-muted d-flex align-items-center gap-2">
            <span className="bg-warning rounded-circle d-inline-block shadow-sm" style={{ width: 8, height: 8 }} />
            Yêu cầu mới nhất
          </div>
          <Link to="/verifier/requests" className="font-monospace text-uppercase small fw-bold text-decoration-none" style={{ color: "#a855f7" }}>Xem tất cả hàng đợi →</Link>
        </Card.Header>
        <ListGroup variant="flush">
          {[
            { id: "VER-2026-0892", vault: "VLT-2024-0047", owner: "Nguyễn Minh Tuấn", executor: "Trần Thị Hương", date: "12/09/2026", urgent: true },
            { id: "VER-2026-0891", vault: "VLT-2025-0123", owner: "Bùi Văn Hải", executor: "Đinh Thị Lan", date: "10/09/2026", urgent: false },
          ].map((r) => (
            <ListGroup.Item key={r.id} className="px-4 py-4 d-flex flex-column flex-md-row md-align-items-center justify-content-between gap-4">
              <div>
                <div className="d-flex align-items-center gap-3 mb-2">
                  <span className="fw-bold fs-5" style={{ color: "#a855f7" }}>{r.id}</span>
                  {r.urgent && <Badge bg="danger" className="text-white font-monospace text-uppercase py-1">KHẨN CẤP</Badge>}
                </div>
                <div className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                   👑 {r.owner} <span className="text-muted fw-normal">|</span> <span className="font-monospace text-muted small">{r.vault}</span>
                </div>
                <div className="font-monospace small text-muted d-flex align-items-center gap-4">
                  <span><strong className="text-primary">Người thi hành:</strong> {r.executor}</span>
                  <span><strong className="opacity-50">⏱️</strong> {r.date}</span>
                </div>
              </div>
              <Button as={Link} to="/verifier/requests" variant="outline-primary" className="fw-bold text-uppercase d-flex align-items-center justify-content-center flex-shrink-0" style={{ borderColor: "#a855f7", color: "#a855f7" }}>
                THẨM ĐỊNH HỒ SƠ
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card>
    </Container>
  );
}
