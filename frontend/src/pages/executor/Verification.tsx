import { useState, useEffect } from "react";
import { executorApi } from "../../lib/api";
import { Container, Card, Alert, Form, Button, Spinner, Row, Col } from "react-bootstrap";

export default function ExecutorVerification() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    executorApi
      .getAssignments()
      .then((res: any) => {
        const pending = (res.assignments || []).filter(
          (a: any) => a.vault.status === "PENDING_VERIFICATION"
        );
        setAssignments(pending);
        if (pending.length > 0) setSelectedVaultId(pending[0].vault.id);
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError("Vui lòng tải lên giấy chứng tử.");
    if (file.size > 50 * 1024 * 1024) return setError("Kích thước giấy chứng tử không được vượt quá 50MB.");
    
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      return setError("Chỉ hỗ trợ định dạng PDF, JPG, PNG.");
    }
    
    if (!selectedVaultId) return setError("Vui lòng chọn kho.");
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("deathCertificate", file);
      await executorApi.submitVerification(selectedVaultId, formData);
      setSuccess("✅ Hồ sơ đã được nộp thành công! Người xác minh pháp lý sẽ tiến hành xét duyệt.");
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase text-danger small fw-bold">Xác minh Pháp lý</span>
        </div>
        <h1 className="fw-bold mb-2">Nộp hồ sơ tử tuất</h1>
        <p className="text-muted mb-0">
          Tải lên Giấy chứng tử hợp lệ do Cơ quan Nhà nước có thẩm quyền cấp để yêu cầu kích hoạt giao thức thừa kế.
        </p>
      </div>

      {success && <Alert variant="success" className="shadow-sm border-0">✅ {success}</Alert>}
      {error && <Alert variant="danger" className="shadow-sm border-0">⚠️ {error}</Alert>}

      {!loading && assignments.length === 0 && !success ? (
        <Card className="text-center py-5 border-dashed bg-light shadow-sm mb-4">
          <Card.Body className="d-flex flex-column align-items-center">
            <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80, fontSize: 40 }}>
              🛡️
            </div>
            <Card.Title className="fw-bold fs-4 mb-2">Không có yêu cầu xử lý</Card.Title>
            <Card.Text className="text-muted">
              Bạn không có nhiệm vụ nào cần nộp hồ sơ vào lúc này. Vui lòng quay lại sau.
            </Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-0 mb-4 position-relative overflow-hidden">
          <div className="position-absolute bg-danger opacity-10 rounded-circle" style={{ width: 400, height: 400, top: -100, right: -100, filter: 'blur(80px)' }} />
          
          <Card.Body className="p-4 p-md-5 position-relative z-1">
            <Form onSubmit={handleSubmit}>
              {assignments.length > 1 && (
                <Form.Group className="mb-4">
                  <Form.Label className="font-monospace small text-uppercase text-muted fw-bold">Chọn kho di sản cần kích hoạt *</Form.Label>
                  <Form.Select 
                    value={selectedVaultId}
                    onChange={(e) => setSelectedVaultId(e.target.value)}
                    className="py-3 shadow-sm border-0 bg-light"
                  >
                    {assignments.map((a: any) => (
                      <option key={a.vault.id} value={a.vault.id}>{a.vault.name} — Sở hữu bởi: {a.vault.owner?.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              <Form.Group className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="font-monospace small text-uppercase text-muted fw-bold mb-0">Giấy chứng tử (Death Certificate) *</Form.Label>
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary font-monospace">Max: 50MB</span>
                </div>
                
                <label 
                  className={`d-flex flex-column align-items-center justify-content-center border-2 border-dashed rounded p-5 text-center cursor-pointer ${file ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary bg-light'}`}
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                >
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="d-none"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <>
                      <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, fontSize: 32 }}>
                        📄
                      </div>
                      <h6 className="fw-bold mb-1">{file.name}</h6>
                      <div className="text-primary font-monospace small">
                        {(file.size / 1024 / 1024).toFixed(2)} MB — Nhấn để thay file khác
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, fontSize: 32 }}>
                        📂
                      </div>
                      <h6 className="fw-bold mb-1">Kéo thả hoặc nhấn để chọn file</h6>
                      <div className="text-muted font-monospace small">Hỗ trợ định dạng .pdf, .jpg, .png</div>
                    </>
                  )}
                </label>
              </Form.Group>

              <Alert variant="warning" className="d-flex gap-3 mb-4 border-warning shadow-sm">
                <span className="fs-4">⚖️</span>
                <div className="small text-dark">
                  <strong>Lưu ý pháp lý:</strong> Nộp tài liệu giả mạo là hành vi vi phạm pháp luật. Hệ thống sẽ ghi lại toàn bộ thao tác, địa chỉ IP, và băm dữ liệu vào chuỗi khối bất biến (Immutable Audit Trail) phục vụ điều tra nếu có gian lận.
                </div>
              </Alert>

              <Button 
                variant="danger" 
                type="submit" 
                disabled={submitting || !file}
                className="w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <><Spinner size="sm" animation="border" /> ĐANG MÃ HÓA VÀ GỬI...</>
                ) : (
                  "NỘP HỒ SƠ PHÁP LÝ"
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Process info */}
      <Card className="shadow-sm border-0 bg-light">
        <Card.Body className="p-4 p-md-5">
          <h4 className="fw-bold mb-4">Trình tự Pháp lý</h4>
          <Row className="g-4">
            {[
              { step: "01", title: "Nộp hồ sơ", desc: "Hệ thống ghi nhận và chuyển trạng thái SUBMITTED." },
              { step: "02", title: "Kiểm duyệt độc lập", desc: "Luật sư hoặc Người xác minh sẽ đánh giá hồ sơ." },
              { step: "03", title: "Phê duyệt (Ký số)", desc: "Xác thực danh tính eKYC của Người xác minh." },
              { step: "04", title: "Kích hoạt hợp đồng", desc: "Hệ thống giải phóng và phân bổ tài sản." },
            ].map((s, i) => (
              <Col xs={12} sm={6} lg={3} key={i}>
                <Card className="h-100 border-0 shadow-sm position-relative overflow-hidden">
                  <div className="position-absolute end-0 top-0 p-3 fs-1 fw-bold text-muted opacity-25" style={{ zIndex: 0 }}>
                    {s.step}
                  </div>
                  <Card.Body className="position-relative z-1">
                    <h6 className="fw-bold mb-2">{s.title}</h6>
                    <p className="text-muted small mb-0">{s.desc}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}
