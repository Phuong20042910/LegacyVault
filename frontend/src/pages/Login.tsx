import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth, UserRole } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Alert, Badge, Spinner, Container, Row, Col, Card, Form, Button, Dropdown } from "react-bootstrap";

const features = [
  { icon: "🔐", label: "Mã hóa AES-256-GCM Đầu-Cuối" },
  { icon: "⚡", label: "Dead Man's Switch tự động" },
  { icon: "📜", label: "Xác minh Pháp lý Độc lập" },
];

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return setError("Vui lòng nhập địa chỉ email.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Email không đúng định dạng.");
    
    if (!password) return setError("Vui lòng nhập mật khẩu.");

    setLoading(true);
    setError("");
    try {
      const result = await login(email, password);
      if (result.success) {
        setSuccessMsg("Đăng nhập thành công! Đang chuyển hướng...");
        const storedUser = localStorage.getItem("legacyvault_user");
        const role = storedUser ? JSON.parse(storedUser).role : "owner";
        setTimeout(() => {
          navigate(`/${role}`);
        }, 1500);
      } else {
        setError(result.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
        setLoading(false);
      }
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-lv-deep position-relative">
      
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="btn p-2 border-0 rounded-circle position-absolute"
        style={{ top: 20, right: 20, background: "var(--lv-bg-hover)", color: "var(--lv-text-muted)" }}
        title={theme === 'dark' ? "Chế độ Sáng" : "Chế độ Tối"}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <Container className="py-5" style={{ maxWidth: 1000 }}>
        <Card className="shadow-lg border-0 overflow-hidden" style={{ borderRadius: '1rem' }}>
          <Row className="g-0">
            {/* Left Branding Panel */}
            <Col lg={5} className="d-none d-lg-flex flex-column justify-content-between p-5 text-lv" style={{ background: "linear-gradient(160deg, var(--lv-bg-base) 0%, var(--lv-bg-deep) 100%)" }}>
              <div>
                <div className="d-flex align-items-center gap-3 mb-5">
                  <div className="d-flex align-items-center justify-content-center fw-bold rounded bg-warning text-dark" style={{ width: 44, height: 44, fontSize: 14, letterSpacing: 1 }}>
                    LV
                  </div>
                  <div>
                    <div className="fw-bold fs-5">LegacyVault</div>
                    <div className="text-secondary small font-monospace text-uppercase" style={{ letterSpacing: "0.1em", fontSize: 10 }}>Secure Digital Heritage</div>
                  </div>
                </div>

                <h1 className="fw-bold mb-4" style={{ fontSize: "2.5rem", lineHeight: 1.2 }}>
                  Bảo vệ di sản<br />
                  <span className="text-warning fst-italic">vượt thời gian</span>
                </h1>
                <p className="text-lv mb-5 opacity-75" style={{ fontSize: "0.95rem", lineHeight: 1.7 }}>
                  Nền tảng lưu trữ và bàn giao tài sản kỹ thuật số siêu bảo mật.
                  Dữ liệu được mã hóa ngay trên thiết bị của bạn — máy chủ không thể đọc.
                </p>
              </div>

              <div className="d-flex flex-column gap-3 mb-5">
                {features.map((f, i) => (
                  <div key={i} className="d-flex align-items-center gap-3 p-3 rounded border-warning" style={{ background: "rgba(255, 193, 7, 0.05)", border: "1px solid rgba(255, 193, 7, 0.25)" }}>
                    <span className="fs-5">{f.icon}</span>
                    <span className="fw-medium small text-lv">{f.label}</span>
                  </div>
                ))}
              </div>

              <Row className="pt-4 border-top border-secondary border-opacity-25">
                {[
                  { label: "Tài sản bảo vệ", value: "$2.4B+" },
                  { label: "Kho lưu trữ", value: "12,847" },
                  { label: "Uptime", value: "99.99%" },
                ].map((s, i) => (
                  <Col key={i}>
                    <div className="text-lv opacity-75 font-monospace text-uppercase mb-1" style={{ fontSize: 10, letterSpacing: "0.1em" }}>{s.label}</div>
                    <div className="fw-bold fs-4 text-lv">{s.value}</div>
                  </Col>
                ))}
              </Row>
            </Col>

            {/* Right Login Panel */}
            <Col lg={7} className="d-flex flex-column justify-content-center p-4 p-md-5 bg-lv-card">
              <div className="d-flex d-lg-none align-items-center gap-2 mb-4">
                <div className="d-flex align-items-center justify-content-center fw-bold rounded bg-warning text-dark" style={{ width: 36, height: 36, fontSize: 12 }}>
                  LV
                </div>
                <span className="fw-bold fs-5 text-dark">LegacyVault</span>
              </div>

              <div className="mb-4">
                <h2 className="fw-bold mb-1">Đăng nhập</h2>
                <p className="text-muted small">Truy cập vào kho lưu trữ di sản của bạn</p>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted font-monospace text-uppercase small">Địa chỉ Email</Form.Label>
                  <Form.Control type="email" size="lg" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@legacyvault.vn" required className="fs-6 form-control-lv" />
                </Form.Group>

                <Form.Group className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="text-muted font-monospace text-uppercase small mb-0">Mật khẩu</Form.Label>
                    <Link to="/forgot-password" className="text-warning text-decoration-none small fw-bold">Quên mật khẩu?</Link>
                  </div>
                  <Form.Control type="password" size="lg" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" required className="fs-6 form-control-lv" />
                </Form.Group>

                {error && <Alert variant="danger" className="py-2 small">⚠️ {error}</Alert>}
                {successMsg && <Alert variant="success" className="py-2 small">✅ {successMsg}</Alert>}

                <Button variant="warning" type="submit" disabled={loading || !!successMsg} size="lg" className="w-100 fw-bold py-3 mt-2">
                  {loading || successMsg ? <><Spinner size="sm" className="me-2" /> Đang xử lý...</> : "ĐĂNG NHẬP →"}
                </Button>
              </Form>

              <div className="text-center mt-4 text-muted small">
                Chưa có kho lưu trữ? <Link to="/register" className="text-warning text-decoration-none fw-bold">Mở tài khoản ngay →</Link>
              </div>
            </Col>
          </Row>
        </Card>
      </Container>
    </div>
  );
}
