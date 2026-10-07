import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useTheme } from "../contexts/ThemeContext";
import { Alert, Spinner, Container, Card, Form, Button } from "react-bootstrap";
import { authApi } from "../lib/api";

export default function ResetPassword() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setError("Vui lòng cung cấp mã khôi phục (token).");
    if (!password) return setError("Vui lòng nhập mật khẩu mới.");
    if (password.length < 8) return setError("Mật khẩu phải có ít nhất 8 ký tự.");
    
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return setError("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.");
    }

    if (password !== confirm) return setError("Mật khẩu xác nhận không khớp.");

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res: any = await authApi.resetPassword({ token, newPassword: password });
      setSuccessMsg(res.message || "Khôi phục mật khẩu thành công!");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra. Token có thể đã hết hạn.");
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
          <h1 className="fw-bold text-lv mb-1">Đặt lại mật khẩu</h1>
          <p className="text-muted small">Tạo mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <Card className="shadow-lg border-0 bg-lv-card p-4" style={{ borderRadius: '1rem' }}>
          {error && <Alert variant="danger" className="py-2 small">⚠️ {error}</Alert>}
          {successMsg && <Alert variant="success" className="py-2 small">✅ {successMsg}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="text-muted font-monospace text-uppercase small">Mã khôi phục (Token)</Form.Label>
              <Form.Control 
                type="text" 
                value={token} 
                onChange={(e) => setToken(e.target.value)} 
                placeholder="Nhập mã khôi phục" 
                required 
                className="fs-6 form-control-lv" 
                readOnly={!!tokenFromUrl}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-muted font-monospace text-uppercase small">Mật khẩu mới *</Form.Label>
              <Form.Control 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Ít nhất 8 ký tự" 
                required 
                className="fs-6 form-control-lv" 
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="text-muted font-monospace text-uppercase small">Xác nhận mật khẩu *</Form.Label>
              <Form.Control 
                type="password" 
                value={confirm} 
                onChange={(e) => setConfirm(e.target.value)} 
                placeholder="Nhập lại mật khẩu" 
                required 
                className="fs-6 form-control-lv" 
              />
            </Form.Group>

            <Button variant="warning" type="submit" disabled={loading || !!successMsg} size="lg" className="w-100 fw-bold py-3 mb-3">
              {loading || successMsg ? <><Spinner size="sm" className="me-2" /> Đang xử lý...</> : "ĐẶT LẠI MẬT KHẨU"}
            </Button>
          </Form>

          <div className="text-center mt-3 text-muted small">
            Quay lại <Link to="/" className="text-warning text-decoration-none fw-bold">Đăng nhập</Link>
          </div>
        </Card>
      </Container>
    </div>
  );
}
