import { useState } from "react";
import { Container, Row, Col, Card, Badge, Button, Modal, Form } from "react-bootstrap";

const beneficiaries = [
  { id: 1, name: "Lê Anh Tú", relation: "Con trai", email: "letuan@email.com", assets: ["Ví Bitcoin", "Ví Ethereum"], verified: true, added: "15/03/2026" },
  { id: 2, name: "Nguyễn Thị Mai", relation: "Vợ", email: "nguyenmai@email.com", assets: ["Vietcombank", "Techcombank", "Google Drive"], verified: true, added: "15/03/2026" },
  { id: 3, name: "Nguyễn Văn Hùng", relation: "Em trai", email: "nguyenhung@email.com", assets: ["Tên miền & Hosting"], verified: false, added: "20/07/2026" },
];

export default function OwnerBeneficiaries() {
  const [modal, setModal] = useState(false);

  return (
    <Container className="py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Người thụ hưởng</h1>
          <p className="text-muted mb-0">Chỉ định và quản lý người nhận tài sản số</p>
        </div>
        <Button variant="warning" className="fw-bold px-4" onClick={() => setModal(true)}>
          + Thêm người thụ hưởng
        </Button>
      </div>

      {/* Executor */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-light border-bottom font-monospace text-uppercase text-muted" style={{ fontSize: "0.85rem" }}>
          Người thi hành Di chúc số
        </Card.Header>
        <Card.Body>
          <div className="p-3 bg-light rounded border d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-warning text-dark rounded d-flex align-items-center justify-content-center fw-bold fs-5" style={{ width: 48, height: 48 }}>
                T
              </div>
              <div>
                <div className="fw-bold">Trần Thị Hương</div>
                <div className="text-muted font-monospace small">executor@legacyvault.vn</div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <Badge bg="success">Người thi hành chính</Badge>
              <Button variant="link" className="text-danger p-0 text-decoration-none fw-bold small">Thu hồi</Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Beneficiaries */}
      <div className="font-monospace text-uppercase text-muted mb-3" style={{ fontSize: "0.85rem" }}>
        Danh sách người thụ hưởng ({beneficiaries.length})
      </div>
      <Row className="g-3">
        {beneficiaries.map((b) => (
          <Col xs={12} key={b.id}>
            <Card className="shadow-sm border-0">
              <Card.Body className="d-flex flex-column flex-md-row justify-content-between gap-3 p-4">
                <div className="d-flex gap-4">
                  <div className="bg-light text-dark border rounded d-flex align-items-center justify-content-center fw-bold fs-5 flex-shrink-0" style={{ width: 48, height: 48 }}>
                    {b.name.charAt(0)}
                  </div>
                  <div>
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <span className="fw-bold">{b.name}</span>
                      <Badge bg="secondary" className="font-monospace fw-normal">{b.relation}</Badge>
                      {b.verified ? (
                        <span className="text-success small font-monospace">● Đã xác minh</span>
                      ) : (
                        <span className="text-warning small font-monospace">○ Chưa xác minh</span>
                      )}
                    </div>
                    <div className="text-muted font-monospace small mb-3">
                      {b.email} &middot; Thêm ngày {b.added}
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {b.assets.map((a) => (
                        <Badge key={a} bg="warning" text="dark" className="border border-warning">{a}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2 align-items-start">
                  <Button variant="light" size="sm" className="fw-bold border">Sửa</Button>
                  <Button variant="outline-danger" size="sm" className="fw-bold">Xóa</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Add Beneficiary Modal */}
      <Modal show={modal} onHide={() => setModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Thêm người thụ hưởng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="d-flex flex-column gap-3">
              {["Họ và tên", "Email liên hệ", "Mối quan hệ", "Số điện thoại"].map((f) => (
                <Form.Group key={f}>
                  <Form.Label className="text-muted font-monospace text-uppercase" style={{ fontSize: "0.8rem" }}>{f}</Form.Label>
                  <Form.Control type="text" placeholder={`Nhập ${f.toLowerCase()}`} />
                </Form.Group>
              ))}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setModal(false)}>Hủy</Button>
          <Button variant="warning" className="fw-bold" onClick={() => setModal(false)}>Thêm & Gửi mời</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
