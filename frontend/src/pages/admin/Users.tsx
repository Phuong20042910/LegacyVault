import { useState, useEffect } from "react";
import { adminApi } from "../../lib/api";
import { Container, Card, Badge, Alert, Button, Spinner, Modal, Form, Table, InputGroup } from "react-bootstrap";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  loginAttempts?: number;
}

const ROLE_LABELS: Record<string, { label: string; text: string; bg: string }> = {
  owner: { label: "Chủ kho", text: "warning", bg: "warning" },
  executor: { label: "Người thi hành", text: "info", bg: "info" },
  beneficiary: { label: "Người thụ hưởng", text: "success", bg: "success" },
  verifier: { label: "Người xác minh", text: "primary", bg: "primary" },
  admin: { label: "Quản trị viên", text: "danger", bg: "danger" },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "owner", phone: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.listUsers({
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(res.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const handleLock = async (user: User) => {
    const action = user.isActive ? "khóa" : "mở khóa";
    if (!confirm(`Xác nhận ${action} tài khoản ${user.name}?`)) return;
    try {
      if (user.isActive) {
        await adminApi.lockUser(user._id);
      } else {
        await adminApi.unlockUser(user._id);
      }
      setSuccessMsg(`✅ Đã ${action} tài khoản ${user.name}.`);
      fetchUsers();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.role) {
      return setFormError("Vui lòng điền đầy đủ thông tin bắt buộc.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return setFormError("Định dạng email không hợp lệ.");
    }
    if (form.phone && !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(form.phone)) {
      return setFormError("Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam hợp lệ.");
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
    if (!passwordRegex.test(form.password)) {
      return setFormError("Mật khẩu phải dài ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.");
    }
    setSaving(true);
    setFormError("");
    try {
      await adminApi.createUser(form);
      setShowCreateModal(false);
      setForm({ name: "", email: "", password: "", role: "owner", phone: "" });
      fetchUsers();
      setSuccessMsg("✅ Đã tạo tài khoản thành công.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-4 mb-4">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <span className="font-monospace text-uppercase small fw-bold text-danger">Quản lý Định danh</span>
          </div>
          <h1 className="fw-bold mb-2">Người dùng hệ thống</h1>
          <p className="text-muted mb-0">
            Phân quyền Role-Based Access Control (RBAC) và kiểm soát trạng thái hoạt động của mọi tài khoản.
          </p>
        </div>
        <Button 
          variant="outline-danger" 
          onClick={() => setShowCreateModal(true)}
          className="fw-bold text-uppercase d-flex align-items-center gap-2"
        >
          + TẠO TÀI KHOẢN
        </Button>
      </div>

      {successMsg && <Alert variant="success" className="shadow-sm border-0">✅ {successMsg}</Alert>}
      {error && <Alert variant="danger" className="shadow-sm border-0">⚠️ {error}</Alert>}

      {/* Filters */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-3 d-flex flex-column flex-md-row gap-3">
          <InputGroup className="flex-grow-1">
            <InputGroup.Text className="bg-light border-end-0">🔍</InputGroup.Text>
            <Form.Control
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tên, email, ID..."
              className="bg-light border-start-0 ps-0"
            />
          </InputGroup>
          <Form.Select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-light"
            style={{ minWidth: '200px', width: 'auto' }}
          >
            <option value="">Tất cả vai trò</option>
            {Object.entries(ROLE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l.label}</option>
            ))}
          </Form.Select>
        </Card.Body>
      </Card>

      {/* Users table */}
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : (
        <Card className="shadow-sm border-0 overflow-hidden">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  {["Người dùng", "Vai trò", "Trạng thái", "Đăng nhập cuối", "Thao tác"].map((h) => (
                    <th key={h} className="text-uppercase small font-monospace text-muted py-3 px-4 border-bottom-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="border-top-0">
                {users.map((user) => {
                  const rl = ROLE_LABELS[user.role] || { label: user.role, bg: "secondary", text: "secondary" };
                  return (
                    <tr key={user._id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-light rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark border shadow-sm" style={{ width: 40, height: 40 }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{user.name}</div>
                            <div className="font-monospace small text-muted mt-1">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge bg={rl.bg} className={`bg-opacity-10 text-${rl.text} border border-${rl.bg} text-uppercase py-2 px-3 font-monospace`}>
                          {rl.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {user.isActive ? (
                          <div className="d-flex align-items-center gap-2">
                            <span className="bg-success rounded-circle" style={{ width: 8, height: 8 }}></span>
                            <span className="text-success fw-bold small text-uppercase">Hoạt động</span>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center gap-2">
                            <span className="bg-danger rounded-circle" style={{ width: 8, height: 8 }}></span>
                            <span className="text-danger fw-bold small text-uppercase">Bị khóa</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-monospace small text-muted">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("vi-VN") : "Chưa đăng nhập"}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Button
                          variant={user.isActive ? "outline-danger" : "outline-success"}
                          size="sm"
                          onClick={() => handleLock(user)}
                          className="fw-bold text-uppercase py-2 px-3"
                        >
                          {user.isActive ? "🔒 KHÓA TÀI KHOẢN" : "🔓 MỞ KHÓA"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
          {users.length === 0 && (
            <div className="text-center py-5">
              <span className="fs-1 opacity-50 mb-3 d-block">👥</span>
              <p className="text-muted small mb-0">Không tìm thấy người dùng nào phù hợp với bộ lọc.</p>
            </div>
          )}
        </Card>
      )}

      {/* Create user modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title>
            <h4 className="fw-bold mb-1">Tạo Định danh</h4>
            <p className="text-muted small mb-0">Cấp phát tài khoản hệ thống mới</p>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form onSubmit={handleCreate}>
            {[
              { key: "name", label: "Họ tên *", type: "text", placeholder: "Nguyễn Văn A" },
              { key: "email", label: "Email *", type: "email", placeholder: "user@legacyvault.vn" },
              { key: "password", label: "Mật khẩu *", type: "password", placeholder: "Tối thiểu 8 ký tự" },
              { key: "phone", label: "Số điện thoại", type: "text", placeholder: "0901234567" },
            ].map((f) => (
              <Form.Group key={f.key} className="mb-3">
                <Form.Label className="font-monospace small text-muted text-uppercase fw-bold">{f.label}</Form.Label>
                <Form.Control
                  type={f.type}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="bg-light py-2"
                />
              </Form.Group>
            ))}
            
            <Form.Group className="mb-4">
              <Form.Label className="font-monospace small text-muted text-uppercase fw-bold">Phân quyền (RBAC) *</Form.Label>
              <Form.Select 
                value={form.role} 
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="bg-light py-2"
              >
                {Object.entries(ROLE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            {formError && <Alert variant="danger" className="py-2 small">⚠️ {formError}</Alert>}
            
            <div className="d-flex gap-2 pt-3 border-top">
              <Button variant="outline-secondary" onClick={() => setShowCreateModal(false)} className="w-50 fw-bold">
                HỦY BỎ
              </Button>
              <Button type="submit" variant="danger" disabled={saving} className="w-50 fw-bold">
                {saving ? (
                  <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/>ĐANG TẠO...</>
                ) : "+ CẤP PHÁT"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
