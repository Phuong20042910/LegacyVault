import { useState, useEffect } from "react";
import { Link } from "react-router";
import { beneficiaryApi } from "../../lib/api";
import { decryptAsset, decryptMasterKey } from "../../lib/crypto";
import { Container, Card, Badge, Alert, Button, Spinner, Modal, Form } from "react-bootstrap";

interface Asset {
  _id: string;
  title: string;
  assetCategory: string;
  claimStatus: string;
  encryptedPayload?: string;
  vaultId?: { vaultName: string; status: string; encryptedMasterKey?: string; masterKeySalt?: string };
  assignedBeneficiaryId?: { name: string; email: string };
}

const ASSET_CAT_ICONS: Record<string, string> = {
  BANK_ACCOUNT: "🏦",
  CRYPTO_WALLET: "₿",
  SOCIAL_MEDIA: "📱",
  LEGAL_DOCUMENT: "📄",
};

const CLAIM_STATUS: Record<string, { label: string; text: string; bg: string }> = {
  UNCLAIMED: { label: "Chưa nhận", text: "secondary", bg: "secondary" },
  NOTIFIED: { label: "Cần Xác Thực Danh Tính", text: "danger", bg: "danger" },
  KYC_VERIFIED: { label: "Sẵn sàng Giải mã", text: "info", bg: "info" },
  DOWNLOADED: { label: "Đã Giải mã", text: "primary", bg: "primary" },
  CONFIRMED: { label: "Hoàn tất Bàn giao", text: "success", bg: "success" },
};

export default function BeneficiaryAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decryptedData, setDecryptedData] = useState<Record<string, object>>({});
  const [passwordModal, setPasswordModal] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchAssets = () => {
    beneficiaryApi
      .getAssets()
      .then((res: any) => setAssets(res.assets || []))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAssets(); }, []);

  const doDecrypt = async () => {
    if (!passwordModal) return;
    try {
      const res: any = await beneficiaryApi.claimAsset(passwordModal);
      const { encryptedMasterKey, masterKeySalt } = res.vaultKeyMaterial;
      const combined = `${masterKeySalt}:${encryptedMasterKey.split(":").slice(1).join(":")}`;
      const masterKeyHex = await decryptMasterKey(combined, password);
      const data = await decryptAsset(res.asset.encryptedPayload, masterKeyHex);
      setDecryptedData((prev) => ({ ...prev, [passwordModal]: data }));
      setPasswordModal(null);
      setPassword("");
      fetchAssets();
      setSuccessMsg("✅ Giải mã tài sản thành công bằng khóa 256-bit AES-GCM.");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch {
      alert("Mật khẩu không chính xác hoặc dữ liệu đã bị hỏng.");
    }
  };

  const handleConfirm = async (assetId: string) => {
    try {
      await beneficiaryApi.confirmAsset(assetId);
      fetchAssets();
      setSuccessMsg("✅ Xác nhận đã nhận và lưu trữ tài sản an toàn.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Container className="py-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase small fw-bold text-success">Quyền lợi Thừa kế</span>
        </div>
        <h1 className="fw-bold mb-2">Tài sản Số</h1>
        <p className="text-muted mb-0">
          Quản lý, giải mã và tiếp nhận danh mục tài sản được phân bổ cho bạn thông qua hợp đồng thông minh của LegacyVault.
        </p>
      </div>

      {successMsg && <Alert variant="success" className="shadow-sm border-0">✅ {successMsg}</Alert>}
      {error && <Alert variant="danger" className="shadow-sm border-0">⚠️ {error}</Alert>}

      {/* eKYC requirement notice */}
      <Alert variant="warning" className="d-flex gap-3 mb-4 shadow-sm border-warning">
        <span className="fs-4">🛡️</span>
        <div className="small text-dark">
          <strong className="d-block mb-1">Chính sách Bảo mật (BR-006):</strong>
          Để kích hoạt tiến trình bàn giao, bạn phải hoàn thành định danh điện tử (eKYC) với cấp độ 3. Dữ liệu tài sản chỉ có thể được giải mã khi hệ thống nhận được Khóa Kích hoạt (Activation Key).
        </div>
      </Alert>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="success" />
        </div>
      ) : assets.length === 0 ? (
        <Card className="text-center py-5 border-dashed bg-light shadow-sm">
          <Card.Body className="d-flex flex-column align-items-center">
            <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80, fontSize: 40, opacity: 0.8 }}>
              🎁
            </div>
            <Card.Title className="fw-bold fs-4 mb-2">Chưa có tài sản</Card.Title>
            <Card.Text className="text-muted">
              Hệ thống chưa ghi nhận tài sản nào được phân bổ cho tài khoản của bạn.
            </Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <div className="d-flex flex-column gap-4">
          {assets.map((asset) => {
            const icon = ASSET_CAT_ICONS[asset.assetCategory] || "💎";
            const cs = CLAIM_STATUS[asset.claimStatus] || CLAIM_STATUS.UNCLAIMED;
            const decrypted = decryptedData[asset._id];
            const canDecrypt = ["KYC_VERIFIED", "DOWNLOADED", "CONFIRMED"].includes(asset.claimStatus);

            return (
              <Card key={asset._id} className="shadow-sm border-0 h-100">
                <Card.Body className="p-4 d-flex flex-column flex-lg-row align-items-lg-start justify-content-between gap-4">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="bg-light rounded d-flex align-items-center justify-content-center fs-3 flex-shrink-0 shadow-sm border" style={{ width: 56, height: 56 }}>
                        {icon}
                      </div>
                      <div className="flex-grow-1">
                        <h4 className="fw-bold mb-1 text-dark">
                          {asset.title}
                        </h4>
                        <div className="font-monospace small text-muted text-uppercase">
                          Nguồn: Kho {asset.vaultId?.vaultName || "—"}
                        </div>
                      </div>
                    </div>

                    {decrypted && (
                      <div className="mt-4 p-4 rounded bg-success bg-opacity-10 border border-success position-relative overflow-hidden">
                        <div className="position-absolute top-0 end-0 p-3 opacity-25">
                           <span className="fs-1">🔓</span>
                        </div>
                        <h6 className="fw-bold mb-3 text-success font-monospace text-uppercase pb-2 border-bottom border-success d-inline-block">DỮ LIỆU ĐÃ GIẢI MÃ</h6>
                        <pre className="mb-0 font-monospace small text-dark position-relative z-1" style={{ whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(decrypted, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="d-flex flex-column align-items-center justify-content-center align-items-lg-end gap-3 flex-shrink-0 pt-3 pt-lg-0 ps-lg-4 border-top border-lg-top-0 border-lg-start min-w-[200px]">
                    <Badge bg={cs.bg} className={`bg-opacity-10 text-${cs.text} border border-${cs.bg} text-uppercase py-2 px-3 font-monospace mb-2 text-center w-100`}>
                      {cs.label}
                    </Badge>
                    
                    {asset.claimStatus === "NOTIFIED" && (
                      <Button as={Link} to="/beneficiary/verify" variant="danger" className="w-100 fw-bold font-monospace small px-4 py-3 d-flex align-items-center justify-content-center gap-2">
                        🪪 XÁC THỰC NGAY
                      </Button>
                    )}
                    {canDecrypt && !decrypted && (
                      <Button onClick={() => setPasswordModal(asset._id)} variant="outline-info" className="w-100 fw-bold font-monospace small px-4 py-3 d-flex align-items-center justify-content-center gap-2">
                        🔓 YÊU CẦU GIẢI MÃ
                      </Button>
                    )}
                    {asset.claimStatus === "DOWNLOADED" && (
                      <Button onClick={() => handleConfirm(asset._id)} variant="success" className="w-100 fw-bold font-monospace small px-4 py-3 d-flex align-items-center justify-content-center gap-2">
                        ✅ XÁC NHẬN HOÀN TẤT
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      {/* Decrypt password modal */}
      <Modal show={!!passwordModal} onHide={() => { setPasswordModal(null); setPassword(""); }} centered backdrop="static">
        <Modal.Body className="p-4 p-md-5 text-center">
          <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: 64, height: 64, fontSize: 32 }}>
             🔐
          </div>
          <h4 className="fw-bold mb-2">Cung cấp Khóa Giải mã</h4>
          <p className="text-muted small mb-4">
            Master Password được sử dụng để giải mã Payload cục bộ (Local Decryption). Mật khẩu không được truyền qua mạng Internet.
          </p>
          
          <Form.Group className="mb-4">
            <Form.Control 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập Master Password" 
              autoFocus
              className="py-3 text-center font-monospace tracking-widest bg-light"
              onKeyDown={(e) => e.key === "Enter" && doDecrypt()} 
            />
          </Form.Group>
          
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={() => { setPasswordModal(null); setPassword(""); }} className="fw-bold w-100">
              HỦY
            </Button>
            <Button variant="info" onClick={doDecrypt} disabled={!password} className="fw-bold w-100 text-white">
              GIẢI MÃ
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
