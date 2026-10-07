import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth, UserRole } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Alert, Spinner, Container, Card, Form, Button, Row, Col, Badge } from "react-bootstrap";

const roles: { value: UserRole; label: string; desc: string; icon: string }[] = [
  { value: "owner",       label: "Chủ sở hữu",       desc: "Tạo và quản lý kho lưu trữ",          icon: "🏛️" },
  { value: "executor",    label: "Người thi hành",    desc: "Điều phối và chuyển giao di sản",      icon: "⚖️" },
  { value: "beneficiary", label: "Người thụ hưởng",  desc: "Nhận tài sản kỹ thuật số thừa kế",     icon: "🎁" },
  { value: "verifier",    label: "Người xác minh",   desc: "Kiểm duyệt pháp lý độc lập",           icon: "🔏" },
];

const steps = ["Thông tin cá nhân", "Bảo mật & Vai trò", "Xác nhận"];

export default function Register() {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    password: "", confirm: "",
    role: "owner" as UserRole,
  });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const selectedRole = roles.find(r => r.value === form.role)!;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Họ tên là bắt buộc.");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) return setError("Email là bắt buộc.");
    if (!emailRegex.test(form.email)) return setError("Email không đúng định dạng (VD: example@domain.com).");

    if (form.phone.trim()) {
      const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
      if (!phoneRegex.test(form.phone.replace(/\s+/g, ''))) {
        return setError("Số điện thoại không hợp lệ (Phải là số điện thoại Việt Nam hợp lệ).");
      }
    }

    setError(""); setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.password) return setError("Mật khẩu là bắt buộc.");
    if (form.password.length < 8) return setError("Mật khẩu phải có ít nhất 8 ký tự.");
    
    // Add strong password validation: at least 1 uppercase, 1 lowercase, 1 number
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(form.password)) {
      return setError("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.");
    }

    if (form.password !== form.confirm) return setError("Mật khẩu xác nhận không khớp.");
    setError(""); setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const result = await register(form.name, form.email, form.password, form.role, form.phone);
      if (result.success) {
        setSuccessMsg("Đăng ký thành công! Đang chuyển qua trang đăng nhập...");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError(result.message || "Đăng ký thất bại. Vui lòng thử lại.");
        setLoading(false);
      }
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-lv-deep py-5 position-relative">
      
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="btn p-2 border-0 rounded-circle position-absolute"
        style={{ top: 20, right: 20, background: "var(--lv-bg-hover)", color: "var(--lv-text-muted)" }}
        title={theme === 'dark' ? "Chế độ Sáng" : "Chế độ Tối"}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <Container style={{ maxWidth: 520 }}>
        {/* Logo */}
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center justify-content-center fw-bold rounded bg-warning text-dark mb-3" style={{ width: 48, height: 48, fontSize: 16 }}>
            LV
          </div>
          <h1 className="fw-bold text-lv mb-1">Tạo tài khoản</h1>
          <p className="text-secondary small">Tham gia LegacyVault để bảo vệ di sản số của bạn</p>
        </div>

        {/* Stepper */}
        <div className="d-flex align-items-center justify-content-center gap-2 mb-5">
          {steps.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={label} className="d-flex align-items-center gap-2">
                <div className="d-flex flex-column align-items-center">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle fw-bold"
                    style={{
                      width: 32, height: 32, fontSize: 13,
                      background: done ? "var(--bs-warning)" : active ? "rgba(255, 193, 7, 0.1)" : "var(--lv-bg-surface)",
                      border: `2px solid ${done || active ? "var(--bs-warning)" : "var(--lv-border-strong)"}`,
                      color: done ? "#000" : active ? "var(--bs-warning)" : "var(--lv-text-muted)",
                    }}
                  >
                    {done ? "✓" : n}
                  </div>
                  <div className="small mt-1 text-center" style={{ color: active ? "var(--bs-warning)" : "var(--lv-text-muted)", whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                    {label}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div
                    style={{
                      height: 2, width: 40, borderRadius: 2,
                      background: step > n ? "var(--bs-warning)" : "var(--lv-border-strong)",
                      marginBottom: 20, flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <Card className="shadow-lg border-0 bg-lv-card p-4" style={{ borderRadius: '1rem' }}>
          {error && <Alert variant="danger" className="py-2 small">⚠️ {error}</Alert>}

          {/* STEP 1 */}
          {step === 1 && (
            <Form onSubmit={handleNext}>
              <h5 className="fw-bold mb-4 text-lv">👤 Thông tin cá nhân</h5>
              <Form.Group className="mb-3">
                <Form.Label className="text-muted font-monospace text-uppercase small">Họ và tên *</Form.Label>
                <Form.Control type="text" value={form.name} onChange={set("name")} placeholder="Nguyễn Văn A" required className="form-control-lv" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="text-muted font-monospace text-uppercase small">Email *</Form.Label>
                <Form.Control type="email" value={form.email} onChange={set("email")} placeholder="email@legacyvault.vn" required className="form-control-lv" />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="text-muted font-monospace text-uppercase small">Số điện thoại (tùy chọn)</Form.Label>
                <Form.Control type="tel" value={form.phone} onChange={set("phone")} placeholder="09xxxxxxxx" className="form-control-lv" />
              </Form.Group>
              <Button variant="warning" type="submit" className="w-100 fw-bold py-2">TIẾP THEO →</Button>
            </Form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <Form onSubmit={handleStep2}>
              <h5 className="fw-bold mb-4 text-lv">🔐 Bảo mật & Vai trò</h5>
              <Form.Group className="mb-3">
                <Form.Label className="text-muted font-monospace text-uppercase small">Mật khẩu *</Form.Label>
                <Form.Control type="password" value={form.password} onChange={set("password")} placeholder="Ít nhất 8 ký tự" required className="form-control-lv" />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="text-muted font-monospace text-uppercase small">Xác nhận mật khẩu *</Form.Label>
                <Form.Control type="password" value={form.confirm} onChange={set("confirm")} placeholder="Nhập lại mật khẩu" required className="form-control-lv" />
              </Form.Group>

              <Form.Label className="text-muted font-monospace text-uppercase small">Chọn vai trò</Form.Label>
              <Row className="g-2 mb-4">
                {roles.map(r => (
                  <Col xs={6} key={r.value}>
                    <div
                      onClick={() => setForm(f => ({ ...f, role: r.value }))}
                      className={`p-3 rounded border text-start h-100 cursor-pointer ${form.role === r.value ? 'bg-warning bg-opacity-10 border-warning' : 'bg-lv-surface border-lv'}`}
                      style={{ cursor: "pointer", transition: "all 0.15s" }}
                    >
                      <div className="fs-4">{r.icon}</div>
                      <div className={`fw-bold small mt-1 ${form.role === r.value ? 'text-warning' : 'text-lv'}`}>{r.label}</div>
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>{r.desc}</div>
                    </div>
                  </Col>
                ))}
              </Row>

              <div className="d-flex gap-2">
                <Button variant="light" onClick={() => setStep(1)} className="border text-muted">← Quay lại</Button>
                <Button variant="warning" type="submit" className="flex-grow-1 fw-bold">TIẾP THEO →</Button>
              </div>
            </Form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <Form onSubmit={handleSubmit}>
              <h5 className="fw-bold mb-4 text-lv">✅ Xác nhận đăng ký</h5>
              <div className="bg-lv-surface rounded p-3 mb-4 border-lv">
                {[
                  ["Họ tên", form.name],
                  ["Email", form.email],
                  ["Điện thoại", form.phone || "—"],
                  ["Vai trò", `${selectedRole.icon} ${selectedRole.label}`],
                ].map(([k, v], idx, arr) => (
                  <div key={k} className={`d-flex justify-content-between py-2 ${idx < arr.length - 1 ? 'border-bottom' : ''}`}>
                    <span className="text-muted small">{k}</span>
                    <span className="fw-bold text-lv small">{v}</span>
                  </div>
                ))}
              </div>
              <Alert variant="warning" className="d-flex gap-2 py-2 small border-warning bg-warning bg-opacity-10">
                <span>🔐</span>
                <span>Mật khẩu của bạn sẽ được băm bằng bcrypt trước khi lưu. LegacyVault không bao giờ lưu mật khẩu rõ.</span>
              </Alert>

              {successMsg && <Alert variant="success" className="py-2 small mt-3">✅ {successMsg}</Alert>}
              
              <div className="d-flex gap-2 mt-4">
                <Button variant="light" onClick={() => setStep(2)} className="border text-muted" disabled={!!successMsg}>← Quay lại</Button>
                <Button variant="warning" type="submit" disabled={loading || !!successMsg} className="flex-grow-1 fw-bold">
                  {loading || successMsg ? <><Spinner size="sm" className="me-2" /> Đang xử lý...</> : "TẠO TÀI KHOẢN"}
                </Button>
              </div>
            </Form>
          )}
        </Card>

        <div className="text-center mt-4 text-secondary small">
          Đã có tài khoản? <Link to="/" className="text-warning text-decoration-none fw-bold">Đăng nhập ngay →</Link>
        </div>
      </Container>
    </div>
  );
}
