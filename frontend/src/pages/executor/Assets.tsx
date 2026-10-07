import { Container, Card, Badge, Alert, ListGroup } from "react-bootstrap";

export default function ExecutorAssets() {
  return (
    <Container className="py-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase text-primary small fw-bold">Khu vực phân bổ di sản</span>
        </div>
        <h1 className="fw-bold mb-2">Tài sản được ủy quyền</h1>
        <p className="text-muted mb-0">
          Danh sách tài sản từ kho lưu trữ <Badge bg="light" text="dark" className="border font-monospace">VLT-2024-0047</Badge> đang được bảo vệ bởi giao thức AES-256.
        </p>
      </div>

      <Alert variant="warning" className="d-flex align-items-center gap-3 shadow-sm border border-warning mb-4">
        <span className="fs-4">⚠</span>
        <div>
          Trạng thái: <strong>Kho lưu trữ chưa được mở khóa</strong>. Bạn cần hoàn tất Xác minh Pháp lý để có thể truy cập chi tiết và phân bổ các tài sản này.
        </div>
      </Alert>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <span className="font-monospace text-uppercase small fw-bold text-muted">Danh mục tài sản mã hóa</span>
          <span className="font-monospace text-uppercase small fw-bold text-muted">7 MỤC</span>
        </Card.Header>
        <Card.Body className="p-0 position-relative">
          {/* Lock overlay pattern */}
          <div className="position-absolute w-100 h-100" style={{ background: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')", opacity: 0.5, pointerEvents: "none", zIndex: 1 }} />
          
          <ListGroup variant="flush">
            {["Ví Bitcoin (₿ 0.847)", "Ví Ethereum (Ξ 4.2)", "Tài khoản Vietcombank ****4821", "Tài khoản Techcombank ****9203", "Google Drive & Photos", "Tài khoản Facebook", "Tên miền & Hosting"].map((a, i) => (
              <ListGroup.Item key={i} className="px-4 py-3 d-flex align-items-center justify-content-between position-relative" style={{ zIndex: 2, background: "transparent" }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light rounded d-flex align-items-center justify-content-center border flex-shrink-0" style={{ width: 48, height: 48, fontSize: 24 }}>
                    🔒
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">{a}</h6>
                    <div className="font-monospace text-muted small text-uppercase" style={{ fontSize: "0.7rem" }}>Đã mã hóa (AES-256-GCM)</div>
                  </div>
                </div>
                <Badge bg="warning" className="text-dark bg-opacity-10 border border-warning font-monospace text-uppercase py-2 px-3">
                  CHƯA MỞ KHÓA
                </Badge>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>
    </Container>
  );
}
