import { useState, useEffect } from "react";
import { adminApi } from "../../lib/api";
import { Container, Row, Col, Card, Badge, Alert, Spinner, ListGroup, ProgressBar } from "react-bootstrap";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.getStats()
      .then((res: any) => setStats(res.stats))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const ROLE_LABELS: Record<string, { label: string, text: string, bg: string }> = {
    owner: { label: "Chủ kho", text: "warning", bg: "warning" },
    executor: { label: "Người thi hành", text: "info", bg: "info" },
    beneficiary: { label: "Người thụ hưởng", text: "success", bg: "success" },
    verifier: { label: "Người xác minh", text: "primary", bg: "primary" },
    admin: { label: "Quản trị viên", text: "danger", bg: "danger" },
  };

  const VAULT_STATUS_LABELS: Record<string, { label: string; text: string; bg: string }> = {
    ACTIVE: { label: "Hoạt động", text: "success", bg: "success" },
    GRACE_PERIOD: { label: "Ân hạn", text: "warning", bg: "warning" },
    PENDING_VERIFICATION: { label: "Chờ xác minh", text: "info", bg: "info" },
    UNLOCKED: { label: "Đã mở khóa", text: "primary", bg: "primary" },
    CLOSED: { label: "Đã đóng", text: "secondary", bg: "secondary" },
  };

  if (loading) return (
    <div className="d-flex justify-content-center py-5">
      <Spinner animation="border" variant="danger" />
    </div>
  );

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase small fw-bold text-danger">Khu vực Giám sát tối cao</span>
        </div>
        <h1 className="fw-bold mb-2">Tổng quan hệ thống</h1>
        <p className="text-muted mb-0">
          Theo dõi và kiểm soát toàn bộ hoạt động của LegacyVault. Mọi bất thường sẽ được cảnh báo ngay lập tức.
        </p>
      </div>

      {error && <Alert variant="danger" className="shadow-sm border-0">⚠️ {error}</Alert>}

      {/* Main stats */}
      <Row className="g-4 mb-4">
        {[
          { title: "Tổng người dùng", value: stats?.totalUsers || 0, icon: "👥", text: "danger" },
          { title: "Tổng kho lưu trữ", value: stats?.totalVaults || 0, icon: "🗄️", text: "warning" },
          { title: "Hồ sơ đang xét", value: stats?.pendingVerifications || 0, icon: "⏳", text: stats?.pendingVerifications > 0 ? "warning" : "secondary" },
        ].map((s) => (
          <Col xs={12} sm={4} key={s.title}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="d-flex align-items-center gap-3 p-4">
                <div className={`bg-${s.text} bg-opacity-10 text-${s.text} rounded d-flex align-items-center justify-content-center fs-2 flex-shrink-0`} style={{ width: 64, height: 64 }}>
                  {s.icon}
                </div>
                <div>
                  <h3 className={`fw-bold mb-1 text-${s.text}`}>{s.value}</h3>
                  <div className="text-muted font-monospace small text-uppercase">{s.title}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4 mb-4">
        {/* Users by role */}
        <Col lg={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-light px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
              <h5 className="fw-bold mb-0">Người dùng theo vai trò</h5>
              <span className="fs-5">📊</span>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex flex-column gap-4">
                {(stats?.usersByRole || []).map((r: any) => {
                  const rl = ROLE_LABELS[r._id] || { label: r._id, text: "secondary", bg: "secondary" };
                  const percent = Math.min(100, (r.count / (stats?.totalUsers || 1)) * 100);
                  return (
                    <div key={r._id} className="d-flex align-items-center justify-content-between gap-3">
                      <div className="d-flex align-items-center gap-2" style={{ width: '120px' }}>
                        <span className={`bg-${rl.bg} rounded-circle d-inline-block`} style={{ width: 10, height: 10 }} />
                        <span className="small fw-bold text-dark">{rl.label}</span>
                      </div>
                      <div className="flex-grow-1">
                        <ProgressBar variant={rl.bg} now={percent} style={{ height: 6 }} className="rounded-pill" />
                      </div>
                      <span className="font-monospace small fw-bold text-muted text-end" style={{ width: '40px' }}>{r.count}</span>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Vaults by status */}
        <Col lg={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-light px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
              <h5 className="fw-bold mb-0">Trạng thái kho lưu trữ</h5>
              <span className="fs-5">📈</span>
            </Card.Header>
            <ListGroup variant="flush">
              {(stats?.vaultsByStatus || []).map((s: any) => {
                const sc = VAULT_STATUS_LABELS[s._id] || { label: s._id, text: "secondary", bg: "secondary" };
                return (
                  <ListGroup.Item key={s._id} className="d-flex align-items-center justify-content-between px-4 py-3">
                    <Badge bg={sc.bg} className={`bg-opacity-10 text-${sc.text} border border-${sc.bg} text-uppercase py-2 px-3 font-monospace`}>
                      {sc.label}
                    </Badge>
                    <span className="fw-bold fs-5 text-dark">
                      {s.count} <span className="small font-monospace text-muted fw-normal">KHO</span>
                    </span>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      {/* Recent activity */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
          <h5 className="fw-bold mb-0">Hoạt động gần đây</h5>
          <span className="fs-5">⚡</span>
        </Card.Header>
        <ListGroup variant="flush">
          {(stats?.recentActivity || []).length === 0 ? (
            <div className="text-center py-5 text-muted small">Chưa có hoạt động nào được ghi nhận.</div>
          ) : (
            (stats?.recentActivity || []).map((log: any) => (
              <ListGroup.Item key={log._id} className="d-flex align-items-center justify-content-between px-4 py-3">
                <div className="d-flex align-items-center gap-3">
                  <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger text-uppercase py-2 px-3 font-monospace">
                    {log.action}
                  </Badge>
                  {log.userEmail && <span className="small fw-bold text-dark">{log.userEmail}</span>}
                </div>
                <div className="d-flex align-items-center gap-2 small font-monospace text-muted">
                  <span>⏱️</span>
                  {new Date(log.createdAt).toLocaleString("vi-VN")}
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </Card>
    </Container>
  );
}
