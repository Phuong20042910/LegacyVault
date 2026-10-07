import { Container, Card, Badge, Button, ListGroup } from "react-bootstrap";

const history = [
  { id: "VER-2026-0889", owner: "Lê Minh Châu", vault: "VLT-2023-0089", decision: "approved", date: "08/09/2026", note: "Tài liệu hợp lệ, đầy đủ, giấy chứng tử số 129482" },
  { id: "VER-2026-0885", owner: "Vũ Thị Lan", vault: "VLT-2024-0201", decision: "approved", date: "02/09/2026", note: "Công chứng xác nhận đầy đủ, khớp thông tin eKYC" },
  { id: "VER-2026-0880", owner: "Đặng Văn Tùng", vault: "VLT-2025-0044", decision: "rejected", date: "28/08/2026", note: "Giấy chứng tử không có dấu công chứng, bản scan mờ không thể đọc" },
  { id: "VER-2026-0876", owner: "Hoàng Minh Dũng", vault: "VLT-2024-0178", decision: "approved", date: "20/08/2026", note: "Hồ sơ đầy đủ, đã xác minh trực tiếp với cơ quan cấp" },
];

export default function VerifierHistory() {
  return (
    <Container className="py-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase small fw-bold" style={{ color: "#a855f7" }}>Nghiệp vụ Chuyên môn</span>
        </div>
        <h1 className="fw-bold mb-2">Lịch sử Thẩm định</h1>
        <p className="text-muted mb-0">
          Tra cứu toàn bộ các hồ sơ đã được bạn xét duyệt. Mọi quyết định đều được lưu lại vĩnh viễn trên hệ thống Audit Log.
        </p>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light px-4 py-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="fw-bold text-dark d-flex align-items-center gap-2 fs-5">
            <span className="opacity-75">📂</span> Kho Lưu trữ Hồ sơ
          </div>
          <div className="font-monospace small fw-bold text-uppercase text-muted d-flex gap-3">
            <Badge bg="secondary" className="bg-opacity-10 text-dark border text-uppercase py-2 px-3">TỔNG: <span className="ms-1">17</span></Badge>
            <Badge bg="success" className="bg-opacity-10 text-success border border-success text-uppercase py-2 px-3">PHÊ DUYỆT: <span className="ms-1 fw-bold">14</span></Badge>
            <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger text-uppercase py-2 px-3">TỪ CHỐI: <span className="ms-1 fw-bold">3</span></Badge>
          </div>
        </Card.Header>
        
        <ListGroup variant="flush">
          {history.map((h) => (
            <ListGroup.Item key={h.id} className="px-4 py-4 d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-4">
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <span className="fw-bold fs-5" style={{ color: "#a855f7" }}>{h.id}</span>
                  <Badge bg={h.decision === "approved" ? "success" : "danger"} className="bg-opacity-10 border text-uppercase py-1 px-2 font-monospace" style={{ color: h.decision === "approved" ? "var(--bs-success)" : "var(--bs-danger)", borderColor: h.decision === "approved" ? "rgba(25, 135, 84, 0.5)" : "rgba(220, 53, 69, 0.5)" }}>
                    {h.decision === "approved" ? "✓ Ký số Phê duyệt" : "✕ Từ chối Hồ sơ"}
                  </Badge>
                </div>
                <div className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                   👑 {h.owner} <span className="text-muted fw-normal">|</span> <span className="font-monospace text-muted small">{h.vault}</span>
                </div>
                <div className="font-monospace small text-muted p-3 rounded bg-light border-start border-3" style={{ borderLeftColor: h.decision === "approved" ? "var(--bs-success)" : "var(--bs-danger)" }}>
                  <span className="text-uppercase d-block mb-1 opacity-75">Ghi chú Thẩm định:</span>
                  {h.note}
                </div>
              </div>
              <div className="font-monospace small text-muted flex-shrink-0 d-flex align-items-center gap-2 mt-2 mt-md-0">
                <span className="opacity-75">📅</span> {h.date}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
        
        <Card.Footer className="bg-light p-3 d-flex justify-content-center border-top">
           <Button variant="outline-secondary" className="fw-bold text-uppercase font-monospace small px-4">
              TẢI THÊM LỊCH SỬ ↓
           </Button>
        </Card.Footer>
      </Card>
    </Container>
  );
}
