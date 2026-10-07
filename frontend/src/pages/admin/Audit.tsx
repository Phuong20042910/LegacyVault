import { useState, useEffect } from "react";
import { adminApi } from "../../lib/api";
import { Container, Card, Badge, Alert, Spinner, Form, Row, Col, Pagination } from "react-bootstrap";

interface AuditLog {
  _id: string;
  action: string;
  userId?: { name: string; email: string; role: string };
  userEmail?: string;
  userRole?: string;
  targetType?: string;
  ipAddress?: string;
  createdAt: string;
  entryHash?: string;
  metadata?: any;
}

const ACTION_COLORS: Record<string, string> = {
  USER_LOGGED_IN: "info",
  USER_REGISTERED: "success",
  VAULT_CREATED: "warning",
  VAULT_DELETED: "danger",
  ASSET_CREATED: "info",
  ASSET_DELETED: "danger",
  HEARTBEAT_RESET: "success",
  DMS_PING_SENT: "warning",
  DMS_ESCALATED: "danger",
  VERIFICATION_SUBMITTED: "info",
  VERIFICATION_APPROVED: "success",
  VERIFICATION_REJECTED: "danger",
  VAULT_UNLOCKED: "primary",
  VAULT_CLOSED: "secondary",
  KYC_APPROVED: "success",
  ASSET_CLAIMED: "primary",
  ADMIN_USER_LOCKED: "danger",
  ADMIN_USER_UNLOCKED: "success",
};

export default function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.getAuditLogs({
        action: actionFilter || undefined,
        page,
        limit: 30,
      });
      setLogs(res.logs || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [actionFilter, page]);

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-2">
          <span className="font-monospace text-uppercase small fw-bold text-danger">Theo vết hệ thống</span>
        </div>
        <h1 className="fw-bold mb-2">Nhật ký Audit</h1>
        <p className="text-muted mb-0">
          BR-007 / NFR-003 — Hệ thống nhật ký bất biến. Tổng cộng có <strong className="text-dark">{total.toLocaleString()}</strong> bản ghi được mã hóa và băm (hashing).
        </p>
      </div>

      {/* Immutability notice */}
      <Alert variant="warning" className="d-flex gap-3 mb-4 shadow-sm border-warning">
        <span className="fs-4">🔒</span>
        <div className="small text-dark">
          <strong className="d-block mb-1">Nhật ký bất biến (Immutable Audit Trail):</strong>
          Không có vai trò nào, kể cả Super Admin, có quyền xóa hoặc sửa đổi các bản ghi này. Mỗi bản ghi được bảo vệ bằng mã băm SHA-256 nối tiếp nhau để chống giả mạo.
        </div>
      </Alert>

      {error && <Alert variant="danger" className="shadow-sm border-0">⚠️ {error}</Alert>}

      {/* Filter */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-3">
          <Form.Select 
            value={actionFilter} 
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="bg-light"
            style={{ maxWidth: '300px' }}
          >
            <option value="">Tất cả hành động hệ thống</option>
            {Object.keys(ACTION_COLORS).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Form.Select>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : (
        <>
          <div className="d-flex flex-column gap-3 mb-4">
            {logs.map((log) => {
              const actionColor = ACTION_COLORS[log.action] || "secondary";
              return (
                <Card key={log._id} className="shadow-sm border-0 h-100">
                  <Card.Body className="p-4 d-flex flex-column flex-md-row justify-content-between gap-3">
                    <div className="flex-grow-1">
                      <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                        <Badge bg={actionColor} className={`bg-opacity-10 text-${actionColor} border border-${actionColor} text-uppercase py-1 px-2 font-monospace`}>
                          {log.action}
                        </Badge>
                        {log.userId && (
                          <span className="small fw-bold text-dark">
                            {log.userId.name} <span className="text-muted font-monospace small ms-1">({log.userId.email})</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="d-flex flex-wrap align-items-center gap-4 text-muted small mt-3">
                        {log.targetType && (
                           <div className="d-flex align-items-center gap-2">
                             <span>🎯</span>
                             <span className="font-monospace">Target: {log.targetType}</span>
                           </div>
                        )}
                        {log.ipAddress && (
                           <div className="d-flex align-items-center gap-2">
                             <span>🌐</span>
                             <span className="font-monospace">IP: {log.ipAddress}</span>
                           </div>
                        )}
                        {log.entryHash && (
                           <div className="d-flex align-items-center gap-2 bg-light px-2 py-1 rounded border">
                             <span>#️⃣</span>
                             <span className="font-monospace text-dark" title={log.entryHash}>
                               SHA-256: {log.entryHash.slice(0, 16)}...
                             </span>
                           </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-muted small font-monospace d-flex align-items-center gap-2 flex-shrink-0">
                      <span>⏱️</span>
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-5 pt-4 border-top">
              <Pagination className="mb-0">
                <Pagination.Prev onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  ← TRƯỚC
                </Pagination.Prev>
                <Pagination.Item disabled className="font-monospace px-3 text-muted">
                  TRANG <strong className="text-dark mx-1">{page}</strong> / {totalPages}
                </Pagination.Item>
                <Pagination.Next onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  TIẾP →
                </Pagination.Next>
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
