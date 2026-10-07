import { useState } from "react";
import { Link } from "react-router";
import { useTheme } from "../contexts/ThemeContext";
import { Alert, Spinner, Container, Card, Form, Button } from "react-bootstrap";
import { authApi } from "../lib/api";

export default function ForgotPassword() {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [token, setToken] = useState(""); // For demo purposes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError("Vui lòng nhập địa chỉ email.");
    
    setLoading(true);
    setError("");
    setSuccessMsg("");
    setToken("");
    
    try {
      const res: any = await authApi.forgotPassword({ email });
      setSuccessMsg(res.message || "Email khôi phục đã được gửi.");
      if (res.token) {
        setToken(res.token); // Demo only
      }
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
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

      <Container style={{ maxWidth: 500 }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center fw-bold rounded bg-warning text-dark mb-3" style={{ width: 48, height: 48, fontSize: 16 }}>
            LV
          </div>
          <h1 className="fw-bold text-lv mb-1">Quên mật khẩu?</h1>
          <p className="text-muted small">Nhập email của bạn để nhận liên kết khôi phục</p>
        </div>

        <Card className="shadow-lg border-0 bg-lv-card p-4" style={{ borderRadius: '1rem' }}>
          {error && <Alert variant="danger" className="py-2 small">⚠️ {error}</Alert>}
          {successMsg && <Alert variant="success" className="py-2 small">✅ {successMsg}</Alert>}
          
          {token && (
            <Alert variant="info" className="py-2 small text-break">
              <strong>Demo Token:</strong> {token}
              <br/>
              <Link to={`/reset-password?token=${token}`} className="alert-link">
                Nhấp vào đây để đổi mật khẩu ngay
              </Link>
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label className="text-muted font-monospace text-uppercase small">Địa chỉ Email</Form.Label>
              <Form.Control 
                type="email" 
                size="lg" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="email@legacyvault.vn" 
                required 
                className="fs-6 form-control-lv" 
              />
            </Form.Group>

            <Button variant="warning" type="submit" disabled={loading} size="lg" className="w-100 fw-bold py-3 mb-3">
              {loading ? <><Spinner size="sm" className="me-2" /> Đang gửi...</> : "GỬI YÊU CẦU"}
            </Button>
          </Form>

          <div className="text-center mt-3 text-muted small">
            Nhớ lại mật khẩu? <Link to="/" className="text-warning text-decoration-none fw-bold">Đăng nhập</Link>
          </div>
        </Card>
      </Container>
    </div>
  );
}
