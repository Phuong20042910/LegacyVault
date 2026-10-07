import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router";
import { Container, Row, Col, Card, Badge, Button, ListGroup } from "react-bootstrap";

export default function BeneficiaryDashboard() {
  const { user } = useAuth();
  return (
    <Container className="py-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase small fw-bold text-success">Khu vực Người thụ hưởng</span>
        </div>
        <h1 className="fw-bold mb-2">
          Xin chào, <span className="text-success">{user?.name}</span>
        </h1>
        <p className="text-muted mb-0">
          Bạn đã được chỉ định là người tiếp nhận các tài sản số từ di sản thừa kế. Vui lòng hoàn tất xác thực danh tính để bắt đầu.
        </p>
      </div>

      <Row className="g-4 mb-4">
        {[
          { label: "Tài sản thừa kế", value: "2", sub: "Từ Nguyễn Minh Tuấn", text: "success", bg: "success", icon: "🎁" },
          { label: "Giá trị ước tính", value: "1.52 tỷ ₫", sub: "Crypto assets", text: "warning", bg: "warning", icon: "💎" },
          { label: "Trạng thái KYC", value: "Chờ xác thực", sub: "Cần hoàn tất ngay", text: "danger", bg: "danger", icon: "🛡️" },
        ].map((s, i) => (
          <Col xs={12} sm={4} key={i}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="d-flex align-items-center gap-3 p-4">
                <div className={`bg-${s.bg} bg-opacity-10 text-${s.text} rounded d-flex align-items-center justify-content-center fs-2 flex-shrink-0`} style={{ width: 64, height: 64 }}>
                  {s.icon}
                </div>
                <div>
                  <h3 className={`fw-bold mb-1 text-${s.text}`}>{s.value}</h3>
                  <div className="text-muted font-monospace small text-uppercase">{s.label}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm border-success bg-light mb-4 position-relative overflow-hidden">
        <div className="position-absolute bg-success opacity-10 rounded-circle" style={{ width: 300, height: 300, top: -100, right: -50, filter: 'blur(60px)' }} />
        <Card.Body className="p-4 p-md-5 d-flex flex-column flex-md-row align-items-md-center gap-4 position-relative z-1">
          <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 64, height: 64, fontSize: 32 }}>
            <span style={{ animation: 'bounce 2s infinite' }}>🎁</span>
          </div>
          <div className="flex-grow-1">
            <h4 className="fw-bold text-dark mb-2">Tài sản đã được chuyển giao cho bạn</h4>
            <p className="text-muted mb-0">
              Kho lưu trữ của <strong className="text-dark">Nguyễn Minh Tuấn</strong> đã được mở khóa pháp lý. Bạn cần thực hiện Xác thực Danh tính (eKYC) để chứng minh mình là người thụ hưởng hợp pháp và nhận khóa giải mã.
            </p>
          </div>
          <Button as={Link} to="/beneficiary/verify" variant="success" className="fw-bold text-uppercase py-3 px-4 flex-shrink-0 shadow-sm d-flex align-items-center justify-content-center">
            XÁC THỰC DANH TÍNH NGAY →
          </Button>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
           <span className="font-monospace small fw-bold text-muted text-uppercase">Danh mục tài sản</span>
           <span className="font-monospace small fw-bold text-muted text-uppercase">2 MỤC</span>
        </Card.Header>
        <ListGroup variant="flush" className="position-relative">
          <div className="position-absolute w-100 h-100 opacity-25" style={{ backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=")`, pointerEvents: 'none', zIndex: 0 }} />
          {[
            { name: "Ví Bitcoin (Cold Wallet)", value: "₿ 0.847 (~1.2 tỷ ₫)", emoji: "₿", text: "warning" },
            { name: "Ví Ethereum", value: "Ξ 4.2 (~320 triệu ₫)", emoji: "Ξ", text: "primary" },
          ].map((a, i) => (
            <ListGroup.Item key={i} className="px-4 py-4 d-flex align-items-center justify-content-between position-relative z-1">
              <div className="d-flex align-items-center gap-4">
                <div className={`bg-${a.text} bg-opacity-10 text-${a.text} rounded d-flex align-items-center justify-content-center fs-3 font-monospace fw-bold flex-shrink-0 shadow-sm`} style={{ width: 56, height: 56 }}>
                   {a.emoji}
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">{a.name}</h6>
                  <div className={`font-monospace small fw-bold text-${a.text}`}>{a.value}</div>
                </div>
              </div>
              <Badge bg="warning" className="bg-opacity-10 text-warning border border-warning text-uppercase py-2 px-3 font-monospace">
                🔒 CHỜ KYC
              </Badge>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card>
    </Container>
  );
}
