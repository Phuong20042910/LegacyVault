import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { vaultApi, dmsApi } from "../../lib/api";
import StatCard from "../../components/StatCard";
import { Alert, Badge, Modal, Spinner, Container, Row, Col, Card, Button, Form } from "react-bootstrap";

interface Vault {
  _id: string;
  vaultName: string;
  status: string;
  createdAt: string;
  assetCount: number;
  dmsConfig: {
    checkIntervalDays: number;
    gracePeriodDays: number;
    lastCheckInAt: string;
    nextPingDueAt: string;
    consecutiveMisses: number;
    isEnabled: boolean;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string }> = {
  ACTIVE:               { label: "Hoạt động",     bg: "success" },
  GRACE_PERIOD:         { label: "Ân hạn",         bg: "warning" },
  PENDING_VERIFICATION: { label: "Chờ xác minh",  bg: "info" },
  UNLOCKED:             { label: "Đã mở khóa",    bg: "primary" },
  CLOSED:               { label: "Đã đóng",        bg: "secondary" },
};

export default function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkinSuccess, setCheckinSuccess] = useState<string | null>(null);

  // Create modal state
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newVaultName, setNewVaultName] = useState("");
  const [newVaultDesc, setNewVaultDesc] = useState("");
  const [masterPassword, setMasterPassword] = useState("");

  const fetchVaults = async () => {
    try {
      const res: any = await vaultApi.list();
      setVaults(res.vaults || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách kho.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVaults(); }, []);

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultName.trim()) return setCreateError("Tên kho là bắt buộc.");
    if (!masterPassword) return setCreateError("Mật khẩu Master Key là bắt buộc.");
    setCreating(true);
    setCreateError("");
    try {
      const { createVaultMasterKey } = await import("../../lib/crypto");
      const { masterKeySalt, encryptedMasterKey } = await createVaultMasterKey(masterPassword);
      await vaultApi.create({ vaultName: newVaultName, masterKeySalt, encryptedMasterKey, description: newVaultDesc });
      setShowModal(false);
      setNewVaultName(""); setNewVaultDesc(""); setMasterPassword("");
      fetchVaults();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCheckin = async (vaultId: string) => {
    try {
      await dmsApi.checkin(vaultId);
      setCheckinSuccess("✅ Điểm danh sinh tồn thành công! Bộ đếm đã được reset.");
      fetchVaults();
      setTimeout(() => setCheckinSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const totalAssets = vaults.reduce((s, v) => s + (v.assetCount || 0), 0);
  const activeVaults = vaults.filter(v => v.status === "ACTIVE").length;
  const graceVaults  = vaults.filter(v => v.status === "GRACE_PERIOD").length;

  if (loading) return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
      <div className="text-center">
        <Spinner animation="border" variant="warning" style={{ width: 48, height: 48 }} />
        <p className="mt-3 text-warning" style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: "0.1em" }}>
          KHỞI TẠO MÔI TRƯỜNG BẢO MẬT...
        </p>
      </div>
    </Container>
  );

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3 mb-4">
        <div>
          <div className="text-warning text-uppercase mb-1" style={{ fontSize: 11, letterSpacing: "0.12em", fontFamily: "monospace" }}>
            Khu vực quản lý của chủ sở hữu
          </div>
          <h1 className="fw-bold mb-2">
            Xin chào, {user?.name?.split(" ").slice(-1)[0]} 👋
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem", maxWidth: 520 }}>
            Hệ thống đang giám sát tài sản số với mã hóa AES-256-GCM cấp quân sự.
          </p>
        </div>
        <Button variant="warning" onClick={() => setShowModal(true)} className="fw-bold px-4">
          + MỞ KHO MỚI
        </Button>
      </div>

      {/* Alerts */}
      {checkinSuccess && <Alert variant="success">{checkinSuccess}</Alert>}
      {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}

      {/* Grace period warning */}
      {graceVaults > 0 && (
        <Alert variant="warning" className="d-flex align-items-center gap-3 shadow-sm border-warning">
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div>
            <div className="fw-bold">{graceVaults} kho lưu trữ đang trong giai đoạn ân hạn!</div>
            <div className="text-muted" style={{ fontSize: "0.85rem" }}>
              Bạn đã bỏ lỡ lần điểm danh Heartbeat gần nhất. Vui lòng bấm "Tôi vẫn ổn" để reset bộ đếm ngay.
            </div>
          </div>
        </Alert>
      )}

      {/* Stats */}
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <Card className="h-100 shadow-sm border-0 bg-light">
            <Card.Body>
              <Card.Subtitle className="text-muted mb-2 text-uppercase" style={{fontSize: "0.8rem"}}>Tổng kho lưu trữ</Card.Subtitle>
              <Card.Title className="fs-3 fw-bold mb-0">🗄️ {vaults.length}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="h-100 shadow-sm border-0 bg-success bg-opacity-10">
            <Card.Body>
              <Card.Subtitle className="text-success mb-2 text-uppercase" style={{fontSize: "0.8rem"}}>Kho đang hoạt động</Card.Subtitle>
              <Card.Title className="fs-3 fw-bold mb-0 text-success">🛡️ {activeVaults}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="h-100 shadow-sm border-0 bg-info bg-opacity-10">
            <Card.Body>
              <Card.Subtitle className="text-info mb-2 text-uppercase" style={{fontSize: "0.8rem"}}>Tổng tài sản số</Card.Subtitle>
              <Card.Title className="fs-3 fw-bold mb-0 text-info">💎 {totalAssets}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className={`h-100 shadow-sm border-0 ${graceVaults > 0 ? "bg-danger bg-opacity-10" : "bg-light"}`}>
            <Card.Body>
              <Card.Subtitle className={`${graceVaults > 0 ? "text-danger" : "text-muted"} mb-2 text-uppercase`} style={{fontSize: "0.8rem"}}>Cần điểm danh</Card.Subtitle>
              <Card.Title className={`fs-3 fw-bold mb-0 ${graceVaults > 0 ? "text-danger" : "text-muted"}`}>⏱️ {graceVaults}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Vault list */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold mb-0">Danh sách Kho lưu trữ</h4>
        <Badge bg="secondary" className="text-uppercase">{vaults.length} KHO</Badge>
      </div>

      {vaults.length === 0 ? (
        <Card className="text-center py-5 border-dashed shadow-sm">
          <Card.Body>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🗄️</div>
            <Card.Title className="fw-bold">Kho di sản trống</Card.Title>
            <Card.Text className="text-muted mx-auto" style={{ maxWidth: 360 }}>
              Hãy khởi tạo kho lưu trữ đầu tiên để bảo vệ tài sản số quan trọng của bạn.
            </Card.Text>
            <Button variant="warning" onClick={() => setShowModal(true)} className="mt-3 fw-bold px-4">
              KHỞI TẠO NGAY
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {vaults.map((vault) => {
            const sc = STATUS_CONFIG[vault.status] || STATUS_CONFIG.ACTIVE;
            const dms = vault.dmsConfig;
            const nextPing = dms?.nextPingDueAt ? new Date(dms.nextPingDueAt) : null;
            const daysLeft = nextPing ? Math.ceil((nextPing.getTime() - Date.now()) / 86400000) : null;

            return (
              <Col xs={12} xl={6} key={vault._id}>
                <Card className="h-100 shadow-sm border-0" style={{ transition: "all 0.2s ease" }} onMouseEnter={e => e.currentTarget.classList.add('shadow')} onMouseLeave={e => e.currentTarget.classList.remove('shadow')}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-start justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 48, height: 48, fontSize: 24 }}>
                          🗄️
                        </div>
                        <div>
                          <h5 className="fw-bold mb-0">{vault.vaultName}</h5>
                          <small className="text-muted font-monospace">ID: {vault._id.substring(0, 10)}...</small>
                        </div>
                      </div>
                      <Badge bg={sc.bg} className="px-2 py-1">{sc.label}</Badge>
                    </div>

                    <Row className="g-2 mb-4 bg-light rounded p-2 mx-0">
                      <Col xs={6}>
                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: "0.7rem"}}>Tài sản</small>
                        <div className="fw-bold">💎 {vault.assetCount || 0} mục</div>
                      </Col>
                      <Col xs={6}>
                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: "0.7rem"}}>Khởi tạo</small>
                        <div className="fw-bold">📅 {new Date(vault.createdAt).toLocaleDateString("vi-VN")}</div>
                      </Col>
                      <Col xs={12} className="mt-2 pt-2 border-top">
                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: "0.7rem"}}>Trạng thái DMS</small>
                        <div className={daysLeft !== null && daysLeft <= 0 ? "text-danger fw-bold" : "text-muted"}>
                          {dms ? (
                            daysLeft !== null ? (
                              daysLeft > 0
                                ? <>⏱️ Còn <strong className="text-warning">{daysLeft} ngày</strong> đến hạn</>
                                : <>⚠️ Quá hạn điểm danh!</>
                            ) : "Đang cấu hình..."
                          ) : "⚪ Chưa thiết lập DMS"}
                        </div>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2">
                      {vault.status === "GRACE_PERIOD" && (
                        <Button
                          variant="success"
                          className="flex-grow-1 fw-bold bg-opacity-10 text-success border-success"
                          onClick={() => handleCheckin(vault._id)}
                        >
                          ✅ TÔI VẪN ỔN
                        </Button>
                      )}
                      <Button
                        variant="outline-secondary"
                        className="flex-grow-1 fw-bold"
                        onClick={() => navigate("/owner/assets")}
                      >
                        VÀO KHO →
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Create Vault Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold">🗄️ Khởi tạo Kho mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form id="create-vault-form" onSubmit={handleCreateVault}>
            <Form.Group className="mb-3">
              <Form.Label className="text-muted text-uppercase fw-bold" style={{fontSize: "0.8rem"}}>Tên kho lưu trữ *</Form.Label>
              <Form.Control
                type="text"
                value={newVaultName}
                onChange={e => setNewVaultName(e.target.value)}
                placeholder="VD: Di sản số Gia đình Nguyễn"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-muted text-uppercase fw-bold" style={{fontSize: "0.8rem"}}>Mô tả (tùy chọn)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newVaultDesc}
                onChange={e => setNewVaultDesc(e.target.value)}
                placeholder="Mô tả ngắn gọn mục đích của kho này..."
                style={{ resize: "none" }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-muted text-uppercase fw-bold" style={{fontSize: "0.8rem"}}>Mật khẩu Master Key *</Form.Label>
              <Form.Control
                type="password"
                value={masterPassword}
                onChange={e => setMasterPassword(e.target.value)}
                placeholder="Tuyệt đối không để lộ mật khẩu này"
                required
              />
            </Form.Group>
            <Alert variant="info" className="d-flex gap-2 p-3 border-0 bg-light text-muted" style={{fontSize: "0.85rem"}}>
              <span>🔐</span>
              <div>Hệ thống sẽ tạo một salt 256-bit và mã hóa bảo vệ khóa gốc ngay trên thiết bị của bạn. Server không bao giờ nhận được plaintext.</div>
            </Alert>
            {createError && <Alert variant="danger">{createError}</Alert>}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button variant="light" onClick={() => setShowModal(false)}>Hủy bỏ</Button>
          <Button variant="warning" type="submit" form="create-vault-form" disabled={creating} className="fw-bold px-4">
            {creating ? <><Spinner size="sm" className="me-2" /> Đang mã hóa...</> : "KHỞI TẠO KHO"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
