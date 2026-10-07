import { useState, useEffect, useCallback } from "react";
import { vaultApi, assetApi } from "../../lib/api";
import { encryptAsset, decryptAsset, decryptMasterKey } from "../../lib/crypto";
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Spinner, Alert } from "react-bootstrap";

const ASSET_CATEGORIES = [
  { value: "BANK_ACCOUNT", label: "🏦 Tài khoản Ngân hàng" },
  { value: "CRYPTO_WALLET", label: "₿ Ví Tiền mã hóa" },
  { value: "SOCIAL_MEDIA", label: "📱 Mạng xã hội" },
  { value: "LEGAL_DOCUMENT", label: "📄 Tài liệu Pháp lý" },
];

const CLAIM_STATUS_LABEL: Record<string, { label: string; bg: string }> = {
  UNCLAIMED: { label: "Chưa nhận", bg: "secondary" },
  NOTIFIED: { label: "Đã thông báo", bg: "info" },
  KYC_VERIFIED: { label: "Đã KYC", bg: "warning" },
  DOWNLOADED: { label: "Đã tải xuống", bg: "primary" },
  CONFIRMED: { label: "Đã xác nhận", bg: "success" },
};

interface Asset {
  _id: string;
  title: string;
  assetCategory: string;
  encryptedPayload: string;
  claimStatus: string;
  assignedBeneficiaryId?: { name: string; email: string };
  createdAt: string;
}

interface Vault {
  _id: string;
  vaultName: string;
  status: string;
  masterKeySalt: string;
  encryptedMasterKey: string;
}

export default function OwnerAssets() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState<string>("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Decryption
  const [masterPassword, setMasterPassword] = useState("");
  const [decryptedData, setDecryptedData] = useState<Record<string, object>>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [decryptTarget, setDecryptTarget] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({
    title: "",
    assetCategory: "BANK_ACCOUNT",
    assignedBeneficiaryId: "",
    payloadData: "",
    notes: "",
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [formPassword, setFormPassword] = useState("");
  const [formError, setFormError] = useState("");

  const fetchVaults = async () => {
    try {
      const res: any = await vaultApi.list();
      setVaults(res.vaults || []);
      if (res.vaults?.length > 0 && !selectedVaultId) {
        setSelectedVaultId(res.vaults[0]._id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchAssets = useCallback(async () => {
    if (!selectedVaultId) return;
    setLoading(true);
    try {
      const res: any = await assetApi.list(selectedVaultId);
      setAssets(res.assets || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedVaultId]);

  useEffect(() => {
    fetchVaults();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setFormError("Tên tài sản là bắt buộc.");
    if (!form.payloadData.trim()) return setFormError("Dữ liệu nhạy cảm là bắt buộc.");
    if (!form.assignedBeneficiaryId.trim()) return setFormError("ID Người thụ hưởng là bắt buộc.");
    if (!formPassword) return setFormError("Mật khẩu mã hóa là bắt buộc.");

    if (attachment) {
      if (attachment.size > 500 * 1024 * 1024) {
        return setFormError("Kích thước tệp đính kèm không được vượt quá 500MB.");
      }
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(attachment.type)) {
        return setFormError("Chỉ hỗ trợ tệp định dạng PDF, JPG, PNG.");
      }
    }

    setSaving(true);
    setFormError("");

    try {
      const vault = vaults.find((v) => v._id === selectedVaultId)!;
      const masterKeyHex = await decryptMasterKey(vault.encryptedMasterKey, formPassword).catch(() => {
        throw new Error("Mật khẩu mã hóa không đúng. Không thể giải mã Master Key.");
      });

      const encryptedPayload = await encryptAsset(
        { data: form.payloadData, notes: form.notes },
        masterKeyHex
      );

      const formData = new FormData();
      formData.append("assetCategory", form.assetCategory);
      formData.append("title", form.title);
      formData.append("encryptedPayload", encryptedPayload);
      formData.append("assignedBeneficiaryId", form.assignedBeneficiaryId);
      formData.append("notes", form.notes);
      
      if (attachment) {
        formData.append("file", attachment);
      }

      await assetApi.create(selectedVaultId, formData);
      setShowModal(false);
      resetForm();
      fetchAssets();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài sản này? Dữ liệu không thể khôi phục.")) return;
    try {
      await assetApi.delete(selectedVaultId, assetId);
      fetchAssets();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDecrypt = async (assetId: string) => {
    setDecryptTarget(assetId);
    setShowPasswordModal(true);
  };

  const doDecrypt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!decryptTarget || !masterPassword) return;
    try {
      const asset = assets.find((a) => a._id === decryptTarget)!;
      const vault = vaults.find((v) => v._id === selectedVaultId)!;
      const masterKeyHex = await decryptMasterKey(vault.encryptedMasterKey, masterPassword);
      const data = await decryptAsset(asset.encryptedPayload, masterKeyHex);
      setDecryptedData((prev) => ({ ...prev, [decryptTarget]: data }));
      setShowPasswordModal(false);
      setMasterPassword("");
      setDecryptTarget(null);
    } catch {
      alert("Mật khẩu Master Key không đúng hoặc dữ liệu bị hỏng.");
    }
  };

  const resetForm = () => {
    setForm({ title: "", assetCategory: "BANK_ACCOUNT", assignedBeneficiaryId: "", payloadData: "", notes: "" });
    setAttachment(null);
    setFormPassword("");
    setFormError("");
  };

  const currentVault = vaults.find((v) => v._id === selectedVaultId);

  return (
    <Container className="py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
        <div>
          <div className="text-warning text-uppercase mb-1" style={{ fontSize: 11, letterSpacing: "0.12em", fontFamily: "monospace" }}>
            Khu vực mã hóa đầu cuối
          </div>
          <h1 className="fw-bold mb-2">Tài sản số</h1>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem", maxWidth: 520 }}>
            Mã hóa và quản lý các tài sản kỹ thuật số. Mọi dữ liệu đều được mã hóa bằng chuẩn AES-256-GCM.
          </p>
        </div>
        {selectedVaultId && currentVault?.status === "ACTIVE" && (
          <Button variant="warning" className="fw-bold px-4" onClick={() => { resetForm(); setShowModal(true); }}>
            + THÊM TÀI SẢN
          </Button>
        )}
      </div>

      {vaults.length > 1 && (
        <div className="d-flex flex-wrap gap-2 mb-4 p-2 bg-light rounded border">
          {vaults.map((v) => (
            <Button
              key={v._id}
              variant={selectedVaultId === v._id ? "warning" : "light"}
              className="fw-bold"
              onClick={() => setSelectedVaultId(v._id)}
            >
              {v.vaultName}
            </Button>
          ))}
        </div>
      )}

      {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}

      <Alert variant="info" className="d-flex align-items-center gap-3 shadow-sm border-info bg-light">
        <span style={{ fontSize: 24 }}>🔐</span>
        <div>
          <strong>Zero-Knowledge Encryption:</strong> Dữ liệu được mã hóa AES-256-GCM tại trình duyệt. Máy chủ không sở hữu khóa giải mã. Không ai có thể đọc nội dung gốc ngoài bạn.
        </div>
      </Alert>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="warning" />
        </div>
      ) : assets.length === 0 ? (
        <Card className="text-center py-5 border-dashed shadow-sm mb-4">
          <Card.Body>
            <div style={{ fontSize: 56, marginBottom: 16 }}>💎</div>
            <Card.Title className="fw-bold">Chưa có tài sản</Card.Title>
            <Card.Text className="text-muted mx-auto" style={{ maxWidth: 360 }}>
              Thêm tài sản kỹ thuật số đầu tiên vào kho lưu trữ. Dữ liệu sẽ được bảo vệ tuyệt đối.
            </Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4 mb-4">
          {assets.map((asset) => {
            const cat = ASSET_CATEGORIES.find((c) => c.value === asset.assetCategory);
            const cs = CLAIM_STATUS_LABEL[asset.claimStatus] || CLAIM_STATUS_LABEL.UNCLAIMED;
            const decrypted = decryptedData[asset._id];

            return (
              <Col xs={12} key={asset._id}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between gap-4">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="bg-light rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 48, height: 48, fontSize: 24 }}>
                          {cat?.label.split(" ")[0]}
                        </div>
                        <div>
                          <h5 className="fw-bold mb-0">{asset.title}</h5>
                          <small className="text-muted font-monospace">{cat?.label.split(" ").slice(1).join(" ")}</small>
                        </div>
                      </div>
                      
                      <div className="d-flex flex-wrap gap-4 pt-3 border-top">
                        <div>
                          <small className="text-muted text-uppercase fw-bold d-block mb-1" style={{fontSize: "0.7rem"}}>Trạng thái</small>
                          <Badge bg={cs.bg}>{cs.label}</Badge>
                        </div>
                        {asset.assignedBeneficiaryId && (
                          <div>
                            <small className="text-muted text-uppercase fw-bold d-block mb-1" style={{fontSize: "0.7rem"}}>Người thụ hưởng</small>
                            <span className="fw-bold">👤 {asset.assignedBeneficiaryId.name}</span>
                          </div>
                        )}
                        <div>
                          <small className="text-muted text-uppercase fw-bold d-block mb-1" style={{fontSize: "0.7rem"}}>Ngày thêm</small>
                          <span className="text-muted">📅 {new Date(asset.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </div>

                      {decrypted && (
                        <Alert variant="success" className="mt-4 mb-0 font-monospace" style={{ fontSize: "0.85rem" }}>
                          <h6 className="fw-bold border-bottom border-success pb-2 mb-2">🔓 DỮ LIỆU ĐÃ GIẢI MÃ</h6>
                          <pre className="mb-0 text-wrap">{JSON.stringify(decrypted, null, 2)}</pre>
                        </Alert>
                      )}
                    </div>
                    
                    <div className="d-flex flex-md-column gap-2 border-top border-md-top-0 pt-3 pt-md-0 border-md-start ps-md-4 justify-content-center" style={{minWidth: 150}}>
                      <Button variant="outline-warning" className="fw-bold flex-grow-1" onClick={() => handleDecrypt(asset._id)}>
                        🔓 GIẢI MÃ
                      </Button>
                      <Button variant="outline-danger" className="fw-bold" onClick={() => handleDelete(asset._id)} title="Xóa tài sản">
                        🗑️ XÓA
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Create Asset Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold">Thêm Tài sản số</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form id="create-asset-form" onSubmit={handleCreate}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-muted text-uppercase fw-bold" style={{fontSize: "0.8rem"}}>Phân loại *</Form.Label>
                  <Form.Select value={form.assetCategory} onChange={(e) => setForm({ ...form, assetCategory: e.target.value })}>
                    {ASSET_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-muted text-uppercase fw-bold" style={{fontSize: "0.8rem"}}>Tên gợi nhớ *</Form.Label>
                  <Form.Control type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Tài khoản Vietcombank" required />
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="text-muted text-uppercase fw-bold d-flex justify-content-between" style={{fontSize: "0.8rem"}}>
                    Dữ liệu nhạy cảm *
                    <Badge bg="warning" text="dark">AES-256 GCM</Badge>
                  </Form.Label>
                  <Form.Control as="textarea" rows={5} value={form.payloadData} onChange={(e) => setForm({ ...form, payloadData: e.target.value })} placeholder="Nhập thông tin cần bảo mật tuyệt đối..." className="font-monospace" required />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="text-muted text-uppercase fw-bold d-flex justify-content-between" style={{fontSize: "0.8rem"}}>
                    Tệp đính kèm (Tùy chọn)
                    <Badge bg="secondary">Tối đa 500MB</Badge>
                  </Form.Label>
                  <Form.Control 
                    type="file" 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setAttachment(e.target.files[0]);
                      } else {
                        setAttachment(null);
                      }
                    }} 
                    accept="application/pdf,image/jpeg,image/png"
                  />
                  <Form.Text className="text-muted small">Hỗ trợ PDF, JPG, PNG.</Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="text-muted text-uppercase fw-bold" style={{fontSize: "0.8rem"}}>ID Người thụ hưởng *</Form.Label>
                  <Form.Control type="text" value={form.assignedBeneficiaryId} onChange={(e) => setForm({ ...form, assignedBeneficiaryId: e.target.value })} placeholder="Nhập MongoDB ObjectId của Người thụ hưởng" required />
                  <Form.Text className="text-muted font-monospace">Tham chiếu đến ObjectId trong Collection Users</Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={12} className="pt-3 border-top">
                <Form.Group>
                  <Form.Label className="text-muted text-uppercase fw-bold d-flex justify-content-between" style={{fontSize: "0.8rem"}}>
                    Mật khẩu Master Key *
                    <Badge bg="danger">KHÔNG LƯU MÁY CHỦ</Badge>
                  </Form.Label>
                  <Form.Control type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Nhập mật khẩu kho để thực hiện mã hóa" required />
                </Form.Group>
              </Col>
            </Row>

            {formError && <Alert variant="danger" className="mt-3 mb-0">⚠️ {formError}</Alert>}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button variant="light" onClick={() => { setShowModal(false); resetForm(); }}>HỦY BỎ</Button>
          <Button variant="warning" type="submit" form="create-asset-form" disabled={saving} className="fw-bold px-4">
            {saving ? <><Spinner size="sm" className="me-2" /> ĐANG MÃ HÓA...</> : "🔐 MÃ HÓA & LƯU"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Decrypt Password Modal */}
      <Modal show={showPasswordModal} onHide={() => { setShowPasswordModal(false); setMasterPassword(""); }} centered size="sm">
        <Modal.Body className="text-center p-4">
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔓</div>
          <h5 className="fw-bold mb-2">Xác thực giải mã</h5>
          <p className="text-muted small mb-4">Vui lòng nhập Master Password để giải mã trên thiết bị.</p>
          <Form onSubmit={doDecrypt}>
            <Form.Group className="mb-4">
              <Form.Control type="password" value={masterPassword} onChange={(e) => setMasterPassword(e.target.value)} placeholder="Master Password" required className="text-center" autoFocus />
            </Form.Group>
            <div className="d-flex gap-2">
              <Button variant="light" className="flex-grow-1" onClick={() => { setShowPasswordModal(false); setMasterPassword(""); }}>HỦY</Button>
              <Button variant="warning" type="submit" className="flex-grow-1 fw-bold">GIẢI MÃ</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
