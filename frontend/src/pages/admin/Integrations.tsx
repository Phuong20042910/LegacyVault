import { Container, Card, Badge, Button, Row, Col } from "react-bootstrap";

const integrations = [
  { name: "VNPost eKYC", desc: "Xác minh danh tính điện tử qua VNPost", status: "connected", type: "eKYC", emoji: "🪪" },
  { name: "VNPT CA", desc: "Chữ ký số và chứng thư số", status: "connected", type: "Chữ ký số", emoji: "✍️" },
  { name: "Cổng Công chứng Quốc gia", desc: "Kết nối hệ thống công chứng điện tử", status: "pending", type: "Công chứng", emoji: "⚖️" },
  { name: "AWS KMS", desc: "Quản lý khóa mã hóa đám mây", status: "connected", type: "Mã hóa", emoji: "🔑" },
  { name: "Twilio SMS/OTP", desc: "Gửi OTP xác minh qua SMS", status: "connected", type: "OTP", emoji: "📱" },
  { name: "SendGrid Email", desc: "Thông báo và cảnh báo qua email", status: "connected", type: "Email", emoji: "📧" },
];

export default function AdminIntegrations() {
  return (
    <Container className="py-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase small fw-bold text-danger">Quản lý Kết nối</span>
        </div>
        <h1 className="fw-bold mb-2">Tích hợp bên thứ ba</h1>
        <p className="text-muted mb-0">
          Quản lý kết nối API với các dịch vụ lõi như eKYC, chữ ký số, chứng thực điện tử và gửi thông báo SMS/Email.
        </p>
      </div>

      <Row className="g-4">
        {integrations.map(intg => (
          <Col lg={6} key={intg.name}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="p-4 d-flex flex-column flex-sm-row align-items-sm-start justify-content-between gap-4">
                <div className="d-flex align-items-start gap-3">
                  <div className="bg-light rounded d-flex align-items-center justify-content-center fs-3 flex-shrink-0 shadow-sm border" style={{ width: 56, height: 56 }}>
                    {intg.emoji}
                  </div>
                  <div>
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <h5 className="fw-bold text-dark mb-0">{intg.name}</h5>
                      <Badge bg="secondary" className="bg-light text-muted border text-uppercase font-monospace">
                        {intg.type}
                      </Badge>
                    </div>
                    <div className="small text-muted">{intg.desc}</div>
                  </div>
                </div>
                
                <div className="d-flex flex-sm-column align-items-center justify-content-between align-items-sm-end gap-3 flex-shrink-0 pt-3 pt-sm-0 ps-sm-4 border-top border-sm-top-0 border-sm-start w-100 w-sm-auto" style={{ minWidth: 150 }}>
                  {intg.status === "connected" ? (
                    <div className="d-flex align-items-center gap-2">
                      <span className="bg-success rounded-circle" style={{ width: 8, height: 8 }}></span>
                      <span className="text-success font-monospace small fw-bold text-uppercase">Đã kết nối</span>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center gap-2">
                      <span className="bg-warning rounded-circle" style={{ width: 8, height: 8 }}></span>
                      <span className="text-warning font-monospace small fw-bold text-uppercase">Chờ cấu hình</span>
                    </div>
                  )}
                  
                  <Button variant="outline-secondary" size="sm" className="w-100 fw-bold text-uppercase font-monospace py-2">
                    CẤU HÌNH
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
