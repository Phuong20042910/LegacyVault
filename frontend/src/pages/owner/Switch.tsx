import { useState, useEffect, useCallback } from "react";
import { vaultApi, dmsApi } from "../../lib/api";
import { Container, Row, Col, Card, Alert, Spinner, Button, Badge, Form } from "react-bootstrap";

interface DmsConfig {
  checkIntervalDays: number;
  gracePeriodDays: number;
  lastCheckInAt: string;
  nextPingDueAt: string;
  consecutiveMisses: number;
  isEnabled: boolean;
  notificationChannels: { email: boolean; sms: boolean };
}

interface Vault {
  _id: string;
  vaultName: string;
  status: string;
}

const STATUS_LABELS: Record<string, { label: string; bg: string }> = {
  ACTIVE:               { label: "Hoạt động bình thường",  bg: "success" },
  GRACE_PERIOD:         { label: "Đang trong ân hạn",      bg: "warning" },
  PENDING_VERIFICATION: { label: "Chờ xác minh pháp lý",   bg: "info" },
  UNLOCKED:             { label: "Đã mở khóa",             bg: "danger" },
  CLOSED:               { label: "Đã đóng",                 bg: "secondary" },
};

export default function OwnerSwitch() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState("");
  const [config, setConfig] = useState<DmsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    checkIntervalDays: 30,
    gracePeriodDays: 14,
    emailEnabled: true,
    smsEnabled: false,
    isEnabled: true,
  });

  const fetchVaults = async () => {
    try {
      const res: any = await vaultApi.list();
      setVaults(res.vaults || []);
      if (res.vaults?.length > 0) setSelectedVaultId(res.vaults[0]._id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchConfig = useCallback(async () => {
    if (!selectedVaultId) return;
    setLoading(true);
    try {
      const res: any = await dmsApi.getConfig(selectedVaultId);
      setConfig(res.config);
      setForm({
        checkIntervalDays: res.config.checkIntervalDays,
        gracePeriodDays: res.config.gracePeriodDays,
        emailEnabled: res.config.notificationChannels?.email ?? true,
        smsEnabled: res.config.notificationChannels?.sms ?? false,
        isEnabled: res.config.isEnabled,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedVaultId]);

  useEffect(() => { fetchVaults(); }, []);
  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await dmsApi.updateConfig(selectedVaultId, {
        checkIntervalDays: form.checkIntervalDays,
        gracePeriodDays: form.gracePeriodDays,
        notificationChannels: { email: form.emailEnabled, sms: form.smsEnabled },
        isEnabled: form.isEnabled,
      });
      setSuccessMsg("Cấu hình Dead Man's Switch đã được cập nhật.");
      fetchConfig();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCheckin = async () => {
    if (!selectedVaultId) return;
    setCheckinLoading(true);
    try {
      const res: any = await dmsApi.checkin(selectedVaultId);
      setSuccessMsg(res.message);
      fetchConfig();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckinLoading(false);
    }
  };

  const selectedVault = vaults.find((v) => v._id === selectedVaultId);
  const sc = selectedVault ? STATUS_LABELS[selectedVault.status] : null;

  const nextPing = config?.nextPingDueAt ? new Date(config.nextPingDueAt) : null;
  const daysLeft = nextPing ? Math.ceil((nextPing.getTime() - Date.now()) / 86400000) : null;
  const lastCheckin = config?.lastCheckInAt ? new Date(config.lastCheckInAt) : null;
  const graceDeadline = config && nextPing
    ? new Date(nextPing.getTime() + config.gracePeriodDays * 86400000)
    : null;

  return (
    <Container className="py-4" style={{ maxWidth: 800 }}>
      <div className="mb-4">
        <h1 className="fw-bold mb-2">Dead Man's Switch ⚡</h1>
        <p className="text-muted" style={{ fontSize: "0.95rem" }}>
          Cơ chế điểm danh sinh tồn tự động — đảm bảo tài sản được bàn giao đúng người khi bạn không còn khả năng.
        </p>
      </div>

      {/* Vault selector */}
      {vaults.length > 1 && (
        <div className="d-flex flex-wrap gap-2 mb-4 p-2 bg-light rounded border">
          {vaults.map((v) => (
            <Button
              key={v._id}
              variant={selectedVaultId === v._id ? "warning" : "light"}
              className="fw-bold"
              onClick={() => setSelectedVaultId(v._id)}
            >
              🗄️ {v.vaultName}
            </Button>
          ))}
        </div>
      )}

      {successMsg && <Alert variant="success" onClose={() => setSuccessMsg("")} dismissible>✅ {successMsg}</Alert>}
      {error && <Alert variant="danger" onClose={() => setError("")} dismissible>⚠️ {error}</Alert>}

      {/* Status card */}
      {sc && selectedVault && (
        <Alert variant={sc.bg} className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-sm border-0 mb-4">
          <div>
            <div className="fw-bold mb-1 fs-5">{sc.label}</div>
            <div className="small">Kho đang chọn: <strong>{selectedVault.vaultName}</strong></div>
          </div>
          {(selectedVault.status === "ACTIVE" || selectedVault.status === "GRACE_PERIOD") && (
            <Button
              variant="outline-success"
              onClick={handleCheckin}
              disabled={checkinLoading}
              className="fw-bold px-4"
              style={{ backgroundColor: "white" }}
            >
              {checkinLoading ? <><Spinner size="sm" className="me-2" /> Đang gửi...</> : "✅ TÔI VẪN ỔN"}
            </Button>
          )}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="warning" />
        </div>
      ) : config ? (
        <>
          {/* Stats */}
          <Row className="g-3 mb-4">
            {[
              { label: "Lần điểm danh cuối", value: lastCheckin?.toLocaleDateString("vi-VN") || "—" },
              { label: "Hạn tiếp theo", value: nextPing ? `${daysLeft} ngày` : "—", urgent: (daysLeft ?? 999) <= 3 },
              { label: "Deadline ân hạn", value: graceDeadline?.toLocaleDateString("vi-VN") || "—" },
            ].map((s, i) => (
              <Col xs={12} md={4} key={i}>
                <Card className="text-center h-100 shadow-sm border-0 bg-light">
                  <Card.Body className="p-3 d-flex flex-column justify-content-center">
                    <div className="text-muted font-monospace text-uppercase small mb-1">{s.label}</div>
                    <div className={`fw-bold fs-5 ${s.urgent ? 'text-danger' : ''}`}>{s.value}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Config Form */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-bottom pt-3 pb-3">
              <h5 className="fw-bold mb-0">⚙️ Cấu hình DMS</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSave}>
                <Row className="g-4 mb-4">
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="text-muted font-monospace text-uppercase small">Chu kỳ kiểm tra (ngày) <span className="fw-light">(7 - 365)</span></Form.Label>
                      <Form.Control type="number" min={7} max={365} value={form.checkIntervalDays} onChange={(e) => setForm({ ...form, checkIntervalDays: Number(e.target.value) })} required />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label className="text-muted font-monospace text-uppercase small">Thời gian ân hạn (ngày) <span className="fw-light">(Cố định)</span></Form.Label>
                      <Form.Control type="number" value={14} disabled />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="text-muted font-monospace text-uppercase small d-block mb-3">Kênh thông báo ân hạn</Form.Label>
                  <div className="d-flex gap-4">
                    <Form.Check type="checkbox" id="emailEnabled" label="📧 Email" checked={form.emailEnabled} onChange={(e) => setForm({ ...form, emailEnabled: e.target.checked })} />
                    <Form.Check type="checkbox" id="smsEnabled" label="📱 SMS" checked={form.smsEnabled} onChange={(e) => setForm({ ...form, smsEnabled: e.target.checked })} />
                  </div>
                </Form.Group>

                <Alert variant="warning" className="d-flex align-items-center gap-3 mb-4">
                  <Form.Check type="switch" id="isEnabled" checked={form.isEnabled} onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })} className="fs-5" />
                  <span className="fw-bold text-dark">Kích hoạt Dead Man's Switch cho kho này</span>
                </Alert>

                <Button variant="warning" type="submit" disabled={saving} className="w-100 fw-bold py-3">
                  {saving ? <><Spinner size="sm" className="me-2" /> Đang lưu...</> : "💾 LƯU CẤU HÌNH"}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Schedule Info */}
          <Card className="shadow-sm border-0 bg-light">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">📋 Lịch cảnh báo (trong ân hạn)</h6>
              <div className="d-flex flex-column gap-2">
                {[
                  { day: "Ngày 1", desc: "Gửi cảnh báo đầu tiên — bắt đầu ân hạn" },
                  { day: "Ngày 7", desc: "Nhắc nhở lần 2" },
                  { day: "Ngày 12", desc: "Nhắc nhở lần 3 — cảnh báo khẩn" },
                  { day: "48h cuối", desc: "Gửi liên tục mỗi 6 giờ" },
                ].map((w, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-3">
                    <Badge bg="secondary">{w.day}</Badge>
                    <span className="text-muted small">{w.desc}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </>
      ) : null}
    </Container>
  );
}
