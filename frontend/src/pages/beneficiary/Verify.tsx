import { useState } from "react";
import { Link } from "react-router";
import { Container, Card, Button, Form, Alert, Row, Col } from "react-bootstrap";

const steps = ["Xác thực OTP", "CCCD / Hộ chiếu", "Face ID (Selfie)", "Hoàn tất"];

export default function BeneficiaryVerify() {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Kích thước ảnh CCCD không được vượt quá 10MB.");
        return;
      }
      setError("");
      setIdCardFile(file);
    }
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Kích thước ảnh Selfie không được vượt quá 10MB.");
        return;
      }
      setError("");
      setSelfieFile(file);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: 800 }}>
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase small fw-bold text-success">Xác thực danh tính (eKYC)</span>
        </div>
        <h1 className="fw-bold mb-2">Quy trình KYC</h1>
        <p className="text-muted mb-0">
          Định danh điện tử cấp độ 3. Hoàn tất quá trình đối chiếu danh tính với Dữ liệu Quốc gia để nhận khóa giải mã tài sản.
        </p>
      </div>

      {error && <Alert variant="danger" className="shadow-sm border-0 mb-4">⚠️ {error}</Alert>}

      {/* Step indicator */}
      <Card className="shadow-sm border-0 mb-4 position-relative overflow-hidden">
        <div className="position-absolute bg-success opacity-10 rounded-circle" style={{ width: 200, height: 200, bottom: -100, left: '50%', transform: 'translateX(-50%)', filter: 'blur(40px)' }} />
        
        <Card.Body className="p-4 position-relative z-1">
          <div className="d-flex justify-content-between align-items-center position-relative">
            <div className="position-absolute w-100 top-50 start-0 translate-middle-y bg-light" style={{ height: 4, zIndex: 0 }} />
            
            {steps.map((s, i) => {
              const isCompleted = step > i + 1;
              const isCurrent = step === i + 1;
              
              return (
                <div key={s} className="d-flex flex-column align-items-center position-relative z-1" style={{ flex: 1 }}>
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center font-monospace fw-bold mb-2 shadow-sm transition-all ${
                      isCompleted 
                        ? "bg-success text-white" 
                        : isCurrent 
                          ? "bg-white text-success border border-2 border-success" 
                          : "bg-light text-muted border"
                    }`}
                    style={{ width: 40, height: 40, zIndex: 2 }}
                  >
                    {isCompleted ? "✓" : i + 1}
                  </div>
                  <div className={`font-monospace small text-uppercase fw-bold text-center ${isCompleted || isCurrent ? "text-success" : "text-muted"}`} style={{ fontSize: "0.7rem" }}>
                    {s}
                  </div>
                  {/* Progress Line Filler */}
                  {i > 0 && (
                    <div 
                      className="position-absolute top-50 translate-middle-y transition-all" 
                      style={{ 
                        height: 4, 
                        right: '50%', 
                        width: '100%', 
                        backgroundColor: step >= i + 1 ? 'var(--bs-success)' : 'transparent',
                        zIndex: 1 
                      }} 
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0 position-relative z-1" style={{ minHeight: 400 }}>
        <Card.Body className="p-4 p-md-5 d-flex flex-column justify-content-center">
          {step === 1 && (
            <div className="mx-auto text-center" style={{ maxWidth: 400 }}>
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: 64, height: 64, fontSize: 32 }}>
                <span style={{ animation: 'bounce 2s infinite' }}>📱</span>
              </div>
              <h3 className="fw-bold mb-2">Xác thực số điện thoại</h3>
              <p className="text-muted mb-4">Mã OTP đã được gửi đến số <strong className="text-dark">***-***-4821</strong></p>
              
              <Form.Group className="mb-4">
                <Form.Control 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  placeholder="0 0 0 0 0 0" 
                  maxLength={6}
                  className="py-3 text-center font-monospace fs-2 tracking-widest bg-light"
                  style={{ letterSpacing: '0.5em' }}
                />
              </Form.Group>
              
              <p className="font-monospace small text-muted mb-4">
                Chưa nhận được mã? <Button variant="link" className="p-0 text-success fw-bold text-decoration-none shadow-none">Gửi lại (45s)</Button>
              </p>
              
              <Button 
                variant="success"
                onClick={() => setStep(2)} 
                disabled={otp.length < 6} 
                className="w-100 py-3 fw-bold text-uppercase"
              >
                Xác nhận OTP
              </Button>
            </div>
          )}
          
          {step === 2 && (
            <div className="mx-auto text-center w-100" style={{ maxWidth: 500 }}>
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: 64, height: 64, fontSize: 32 }}>
                <span>🪪</span>
              </div>
              <h3 className="fw-bold mb-2">Quét Giấy tờ Tùy thân</h3>
              <p className="text-muted mb-4">Chụp rõ ràng mặt trước và mặt sau CCCD hoặc Hộ chiếu (Tối đa 10MB)</p>
              
              <Form.Group className="mb-4">
                <label className={`d-flex flex-column align-items-center justify-content-center p-5 rounded border border-2 border-dashed ${idCardFile ? 'border-success bg-success bg-opacity-10' : 'bg-light'} text-center cursor-pointer w-100`} style={{ cursor: 'pointer' }}>
                  <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, fontSize: 32 }}>📷</div>
                  <h6 className="fw-bold mb-1 text-dark">{idCardFile ? idCardFile.name : 'Nhấn để chụp / tải ảnh lên'}</h6>
                  <div className="font-monospace small text-muted">Đảm bảo ảnh rõ nét, không bị lóa sáng hay che khuất</div>
                  <input type="file" className="d-none" accept="image/*" onChange={handleIdCardChange} />
                </label>
              </Form.Group>
              
              <Button 
                variant="success"
                onClick={() => setStep(3)} 
                disabled={!idCardFile}
                className="w-100 py-3 fw-bold text-uppercase"
              >
                Tiếp tục →
              </Button>
            </div>
          )}
          
          {step === 3 && (
            <div className="mx-auto text-center w-100" style={{ maxWidth: 500 }}>
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: 64, height: 64, fontSize: 32 }}>
                <span>🤳</span>
              </div>
              <h3 className="fw-bold mb-2">Nhận diện Khuôn mặt (Face ID)</h3>
              <p className="text-muted mb-4">Hệ thống Liveness Detection sẽ kiểm tra tính sinh thể (Tối đa 10MB)</p>
              
              <Form.Group className="mb-4">
                <label className={`d-flex flex-column align-items-center justify-content-center p-5 rounded border border-2 ${selfieFile ? 'border-success bg-success bg-opacity-10' : 'bg-light'} text-center cursor-pointer w-100 position-relative overflow-hidden`} style={{ cursor: 'pointer' }}>
                  <div className="position-absolute start-0 end-0 bg-success opacity-50 shadow-sm" style={{ height: 4, animation: 'scan 2s ease-in-out infinite' }} />
                  
                  <div className="rounded-circle border border-2 border-dashed border-success d-flex align-items-center justify-content-center fs-1 mb-3 position-relative" style={{ width: 96, height: 96 }}>
                     <span className="position-absolute w-100 h-100 rounded-circle border border-success opacity-25" style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                     👤
                  </div>
                  <h6 className="fw-bold mb-1 text-dark">{selfieFile ? selfieFile.name : 'Mở Camera nhận diện'}</h6>
                  <div className="font-monospace small text-muted">Vui lòng tháo khẩu trang, kính râm và nhìn thẳng</div>
                  <input type="file" className="d-none" accept="image/*" capture="user" onChange={handleSelfieChange} />
                </label>
              </Form.Group>
              
              <Button 
                variant="success"
                onClick={() => setStep(4)} 
                disabled={!selfieFile}
                className="w-100 py-3 fw-bold text-uppercase"
              >
                Tiến hành Đối chiếu
              </Button>
            </div>
          )}
          
          {step === 4 && (
            <div className="mx-auto text-center w-100" style={{ maxWidth: 400 }}>
              <div className="bg-success bg-opacity-10 rounded-circle border border-success d-flex align-items-center justify-content-center mx-auto mb-4 position-relative shadow-sm" style={{ width: 96, height: 96 }}>
                 <span className="position-absolute w-100 h-100 rounded-circle border border-success opacity-25" style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                 <span className="fs-1 text-success">✅</span>
              </div>
              
              <div className="mb-4">
                <h2 className="fw-bold mb-2">Định danh Thành công!</h2>
                <p className="text-muted">
                  Dữ liệu sinh trắc học hoàn toàn trùng khớp với CSDL Quốc gia. Bạn đã được cấp quyền truy cập hợp pháp vào kho di sản.
                </p>
              </div>
              
              <Alert variant="light" className="text-start font-monospace small text-muted border mb-4">
                 <div className="mb-1">MATCH_SCORE: <span className="text-success fw-bold">99.87%</span></div>
                 <div className="mb-1">TRANSACTION_ID: <span className="text-dark fw-bold">KYC-2026-92841A</span></div>
                 <div>TIMESTAMP: <span className="text-dark fw-bold">{new Date().toISOString()}</span></div>
              </Alert>
              
              <Button 
                as={Link}
                to="/beneficiary/assets" 
                variant="success"
                className="w-100 py-3 fw-bold text-uppercase d-flex align-items-center justify-content-center"
              >
                TIẾP NHẬN TÀI SẢN NGAY →
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <style>{`
        @keyframes scan {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </Container>
  );
}
