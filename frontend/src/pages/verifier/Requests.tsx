import { useState, useEffect } from "react";
import { verifierApi } from "../../lib/api";
import { Container, Card, Badge, Alert, Button, Spinner, Modal, Form } from "react-bootstrap";

interface VerificationRequest {
  _id: string;
  vaultId: { _id: string; vaultName: string; status: string; ownerId: string };
  executorId: { name: string; email: string; phone?: string };
  verifierId?: { name: string; email: string };
  deathCertificateUrl: string;
  status: string;
  submittedAt: string;
  rejectionReason?: string;
  verifierSignature?: string;
  reviewedAt?: string;
}

const STATUS_LABELS: Record<string, { label: string; bg: string }> = {
  SUBMITTED: { label: "Chờ tiếp nhận", bg: "info" },
  IN_REVIEW: { label: "Đang xét duyệt", bg: "warning" },
  APPROVED: { label: "Đã phê duyệt ✓", bg: "success" },
  REJECTED: { label: "Đã từ chối ✕", bg: "danger" },
};

export default function VerifierRequests() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchRequests = async () => {
    try {
      const res: any = await verifierApi.getRequests();
      setRequests(res.requests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleTake = async (id: string) => {
    try {
      await verifierApi.takeRequest(id);
      fetchRequests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await verifierApi.approveRequest(selectedRequest._id, approveNotes);
      setSuccessMsg("✅ Ký số thành công! Hồ sơ đã được phê duyệt và lưu vết lên hệ thống. Kho lưu trữ chính thức chuyển sang trạng thái UNLOCKED.");
      setSelectedRequest(null);
      setApproveNotes("");
      fetchRequests();
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await verifierApi.rejectRequest(selectedRequest._id, rejectReason);
      setSuccessMsg("Đã từ chối hồ sơ vì không đủ điều kiện pháp lý.");
      setSelectedRequest(null);
      setRejectReason("");
      setShowRejectModal(false);
      fetchRequests();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pending = requests.filter((r) => ["SUBMITTED", "IN_REVIEW"].includes(r.status));
  const done = requests.filter((r) => ["APPROVED", "REJECTED"].includes(r.status));

  return (
    <Container className="py-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase small fw-bold" style={{ color: "#a855f7" }}>Nghiệp vụ Chuyên môn</span>
        </div>
        <h1 className="fw-bold mb-2">Thẩm định Hồ sơ Pháp lý</h1>
        <p className="text-muted mb-0">
          Kiểm tra, xác minh tính hợp pháp của Giấy chứng tử. Mọi quyết định Phê duyệt (Ký số) hoặc Từ chối đều có giá trị pháp lý và không thể hoàn tác.
        </p>
      </div>

      {successMsg && <Alert variant="success" className="shadow-sm border-0">✅ {successMsg}</Alert>}
      {error && <Alert variant="danger" className="shadow-sm border-0">⚠️ {error}</Alert>}

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" style={{ color: "#a855f7" }} />
        </div>
      ) : (
        <>
          {/* Pending requests */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-light px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
              <div className="fw-bold text-dark d-flex align-items-center gap-2 fs-5">
                ⏳ Hàng đợi xử lý
                {pending.length > 0 && (
                  <Badge bg="danger" className="text-white font-monospace text-uppercase py-1 ms-2">
                    {pending.length} YÊU CẦU
                  </Badge>
                )}
              </div>
            </Card.Header>

            {pending.length === 0 ? (
              <Card.Body className="text-center py-5 border-dashed bg-light">
                <div className="d-flex flex-column align-items-center">
                  <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80, fontSize: 40, opacity: 0.5 }}>
                    📂
                  </div>
                  <Card.Title className="fw-bold fs-5 mb-2">Hàng đợi trống</Card.Title>
                  <Card.Text className="text-muted">
                    Không có hồ sơ nào cần bạn thẩm định vào lúc này. Chúc bạn một ngày làm việc hiệu quả!
                  </Card.Text>
                </div>
              </Card.Body>
            ) : (
              <div className="d-flex flex-column">
                {pending.map((req, index) => {
                  const sc = STATUS_LABELS[req.status];
                  return (
                    <div key={req._id} className={`p-4 position-relative ${index < pending.length - 1 ? 'border-bottom' : ''}`}>
                      {req.status === "IN_REVIEW" && <div className="position-absolute start-0 top-0 h-100" style={{ width: 4, backgroundColor: "#a855f7", boxShadow: "0 0 10px #a855f7" }} />}
                      
                      <div className="d-flex flex-column flex-lg-row lg-align-items-start justify-content-between gap-4 ms-2">
                        <div className="flex-grow-1">
                          <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                            <h4 className="fw-bold mb-0">
                              Kho lưu trữ: <span className="font-monospace text-muted">{req.vaultId?.vaultName || "—"}</span>
                            </h4>
                            <Badge bg={sc.bg} className="bg-opacity-10 text-uppercase border py-2 px-3 font-monospace" style={{ color: `var(--bs-${sc.bg})`, borderColor: `rgba(var(--bs-${sc.bg}-rgb), 0.5)` }}>
                              {sc.label}
                            </Badge>
                          </div>
                          
                          <div className="row g-3 small">
                            <div className="col-12 col-sm-6 col-xl-4">
                              <div className="font-monospace text-muted text-uppercase mb-1" style={{ fontSize: "0.7rem" }}>Người thi hành (Executor)</div>
                              <div className="fw-bold text-dark">{req.executorId?.name} <span className="text-muted font-monospace fw-normal">({req.executorId?.email})</span></div>
                            </div>
                            <div className="col-12 col-sm-6 col-xl-4">
                              <div className="font-monospace text-muted text-uppercase mb-1" style={{ fontSize: "0.7rem" }}>Ngày nộp hồ sơ</div>
                              <div className="fw-bold text-muted">{new Date(req.submittedAt).toLocaleDateString("vi-VN")}</div>
                            </div>
                            {req.verifierId && (
                              <div className="col-12 col-sm-6 col-xl-4">
                                <div className="font-monospace text-muted text-uppercase mb-1" style={{ fontSize: "0.7rem" }}>Chuyên viên phụ trách</div>
                                <div className="fw-bold d-flex align-items-center gap-2" style={{ color: "#a855f7" }}>👨‍⚖️ {req.verifierId.name}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="d-flex flex-wrap flex-lg-column align-items-center justify-content-end gap-2 flex-shrink-0 pt-3 pt-lg-0 ps-lg-4 border-top border-lg-top-0 border-lg-start">
                          {req.status === "SUBMITTED" && (
                            <Button
                              onClick={() => handleTake(req._id)}
                              variant="outline-secondary"
                              className="w-100 fw-bold font-monospace small px-4 py-2"
                            >
                              📥 TIẾP NHẬN HỒ SƠ
                            </Button>
                          )}
                          {req.status === "IN_REVIEW" && (
                            <>
                              <Button
                                onClick={() => setSelectedRequest(req)}
                                variant="success"
                                className="w-100 fw-bold font-monospace small px-4 py-2 d-flex align-items-center justify-content-center gap-2 bg-opacity-10 text-success border-success"
                              >
                                ✓ KÝ SỐ PHÊ DUYỆT
                              </Button>
                              <Button
                                onClick={() => { setSelectedRequest(req); setShowRejectModal(true); }}
                                variant="outline-danger"
                                className="w-100 fw-bold font-monospace small px-4 py-2 d-flex align-items-center justify-content-center gap-2"
                              >
                                ✕ TỪ CHỐI
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Done */}
          {done.length > 0 && (
            <div className="mt-5">
              <div className="mb-3">
                 <span className="font-monospace text-uppercase small fw-bold text-muted">Lịch sử thẩm định gần đây</span>
              </div>
              <div className="d-flex flex-column gap-3">
                {done.slice(0, 5).map((req) => {
                  const sc = STATUS_LABELS[req.status];
                  return (
                    <Card key={req._id} className="shadow-sm border-0 bg-light">
                      <Card.Body className="p-3 d-flex flex-column flex-sm-row sm-align-items-center justify-content-between gap-3">
                        <div>
                          <div className="d-flex align-items-center gap-3 mb-1">
                             <span className="fw-bold text-dark font-monospace">{req.vaultId?.vaultName}</span>
                             <Badge bg={sc.bg} className="bg-opacity-10 text-uppercase border py-1 px-2 font-monospace" style={{ color: `var(--bs-${sc.bg})`, borderColor: `rgba(var(--bs-${sc.bg}-rgb), 0.5)` }}>
                               {sc.label}
                             </Badge>
                          </div>
                          <p className="font-monospace small text-muted mb-0">
                            Executor: {req.executorId?.name} <span className="opacity-50 mx-2">|</span> Ngày duyệt: {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString("vi-VN") : "—"}
                          </p>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Approve modal */}
      <Modal show={!!selectedRequest && !showRejectModal} onHide={() => { setSelectedRequest(null); setApproveNotes(""); }} centered backdrop="static">
        <Modal.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: 64, height: 64, fontSize: 32 }}>
               🖋️
            </div>
            <h3 className="fw-bold">Xác nhận Ký số Phê duyệt</h3>
          </div>
          
          <div className="bg-light rounded p-3 mb-4 border">
            <div className="d-flex justify-content-between align-items-center mb-2">
               <span className="text-muted font-monospace small text-uppercase fw-bold">Đối tượng Kích hoạt</span>
               <span className="font-monospace fw-bold" style={{ color: "#a855f7" }}>{selectedRequest?.vaultId?.vaultName}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
               <span className="text-muted font-monospace small text-uppercase fw-bold">Người yêu cầu</span>
               <span className="fw-bold text-dark">{selectedRequest?.executorId?.name}</span>
            </div>
          </div>
          
          <Alert variant="warning" className="border-warning shadow-sm small mb-4">
            <strong className="d-block mb-1">⚠️ CẢNH BÁO PHÁP LÝ KHÔNG THỂ HOÀN TÁC:</strong>
            Thao tác này sẽ áp dụng Chữ ký số (Digital Signature) của bạn vào hồ sơ, chuyển giao toàn bộ quyền truy cập kho di sản cho Người thụ hưởng. Bạn chịu trách nhiệm hoàn toàn trước pháp luật về quyết định này.
          </Alert>
          
          <Form.Group className="mb-4">
            <Form.Label className="font-monospace small text-uppercase text-muted fw-bold">Ghi chú Thẩm định (Tùy chọn)</Form.Label>
            <Form.Control
              as="textarea"
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Giấy chứng tử số 12345/UBND hợp lệ, đủ điều kiện mở khóa..."
              className="bg-light"
            />
          </Form.Group>
          
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={() => { setSelectedRequest(null); setApproveNotes(""); }} className="fw-bold w-100">
              HỦY BỎ
            </Button>
            <Button variant="success" onClick={handleApprove} disabled={actionLoading} className="fw-bold w-100 d-flex align-items-center justify-content-center gap-2">
              {actionLoading ? "ĐANG KÝ SỐ..." : "🔐 TÔI ĐỒNG Ý KÝ SỐ"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Reject modal */}
      <Modal show={showRejectModal} onHide={() => { setShowRejectModal(false); setSelectedRequest(null); setRejectReason(""); }} centered backdrop="static">
        <Modal.Body className="p-4 p-md-5">
           <div className="text-center mb-4">
             <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: 64, height: 64, fontSize: 32 }}>
               ✕
            </div>
            <h3 className="fw-bold">Từ chối Hồ sơ</h3>
          </div>
          
          <Form.Group className="mb-4">
            <Form.Label className="font-monospace small text-uppercase text-danger fw-bold">Lý do từ chối (Bắt buộc) *</Form.Label>
            <Form.Control
              as="textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Trình bày rõ lý do không hợp lệ để Người thi hành bổ sung hồ sơ..."
              className="border-danger bg-danger bg-opacity-10 text-dark"
            />
          </Form.Group>
          
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={() => { setShowRejectModal(false); setSelectedRequest(null); setRejectReason(""); }} className="fw-bold w-100">
              HỦY
            </Button>
            <Button variant="danger" onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} className="fw-bold w-100 d-flex align-items-center justify-content-center gap-2">
              {actionLoading ? "ĐANG XỬ LÝ..." : "TỪ CHỐI HỒ SƠ NÀY"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
