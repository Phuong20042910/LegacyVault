import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth, UserRole } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const roleConfig: Record<UserRole, {
  label: string;
  icon: string;
  badgeColor: string;
  nav: { path: string; label: string; icon: string }[];
}> = {
  owner: {
    label: "Chủ sở hữu",
    icon: "🏛️",
    badgeColor: "var(--lv-gold)",
    nav: [
      { path: "/owner",                label: "Tổng quan",          icon: "⊞" },
      { path: "/owner/assets",         label: "Tài sản số",         icon: "💎" },
      { path: "/owner/beneficiaries",  label: "Người thụ hưởng",    icon: "👥" },
      { path: "/owner/switch",         label: "Dead Man's Switch",  icon: "⚡" },
      { path: "/owner/documents",      label: "Tài liệu pháp lý",   icon: "📄" },
      { path: "/owner/logs",           label: "Nhật ký hoạt động",  icon: "📋" },
    ],
  },
  executor: {
    label: "Người thi hành",
    icon: "⚖️",
    badgeColor: "#60a5fa",
    nav: [
      { path: "/executor",                label: "Tổng quan",         icon: "⊞" },
      { path: "/executor/assets",         label: "Tài sản ủy quyền",  icon: "💎" },
      { path: "/executor/verification",   label: "Xác minh pháp lý",  icon: "📄" },
      { path: "/executor/progress",       label: "Tiến độ bàn giao",  icon: "📊" },
    ],
  },
  beneficiary: {
    label: "Người thụ hưởng",
    icon: "🎁",
    badgeColor: "#4ade80",
    nav: [
      { path: "/beneficiary",          label: "Tổng quan",          icon: "⊞" },
      { path: "/beneficiary/assets",   label: "Tài sản thừa kế",    icon: "💎" },
      { path: "/beneficiary/verify",   label: "Xác thực danh tính", icon: "🔏" },
    ],
  },
  verifier: {
    label: "Người xác minh",
    icon: "🔏",
    badgeColor: "#c084fc",
    nav: [
      { path: "/verifier",            label: "Tổng quan",         icon: "⊞" },
      { path: "/verifier/requests",   label: "Yêu cầu xác minh",  icon: "📄" },
      { path: "/verifier/history",    label: "Lịch sử hồ sơ",     icon: "📋" },
    ],
  },
  admin: {
    label: "Quản trị viên",
    icon: "🛡️",
    badgeColor: "#f87171",
    nav: [
      { path: "/admin",               label: "Tổng quan",          icon: "⊞" },
      { path: "/admin/users",         label: "Quản lý người dùng", icon: "👥" },
      { path: "/admin/audit",         label: "Nhật ký bảo mật",    icon: "📋" },
      { path: "/admin/config",        label: "Cấu hình hệ thống",  icon: "⚙️" },
      { path: "/admin/integrations",  label: "Tích hợp bên thứ ba",icon: "🔗" },
    ],
  },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;
  const cfg = roleConfig[user.role];

  const handleLogout = () => { logout(); navigate("/"); };

  const SidebarContent = () => (
    <div className="d-flex flex-column h-100">
      {/* Logo */}
      <div
        className="d-flex align-items-center gap-3 px-3 py-4"
        style={{ borderBottom: "1px solid var(--lv-border)" }}
      >
        <div
          className="d-flex align-items-center justify-content-center fw-bold rounded flex-shrink-0"
          style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, var(--lv-gold), var(--lv-gold-light))",
            color: "var(--lv-bg-deep)",
            fontSize: 13,
            letterSpacing: 1,
          }}
        >
          LV
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="fw-bold" style={{ color: "#fff", fontSize: 15, lineHeight: 1.2 }}>LegacyVault</div>
            <div style={{ fontSize: 10, color: "var(--lv-text-subtle)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Di sản số bảo mật
            </div>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div
          className="mx-3 mt-3 mb-1 px-3 py-2 rounded-lv"
          style={{
            background: `${cfg.badgeColor}18`,
            border: `1px solid ${cfg.badgeColor}33`,
          }}
        >
          <div style={{ fontSize: 10, color: "var(--lv-text-subtle)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Vai trò</div>
          <div className="d-flex align-items-center gap-2 mt-1">
            <span>{cfg.icon}</span>
            <span className="fw-semibold" style={{ fontSize: 13, color: cfg.badgeColor }}>{cfg.label}</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-grow-1 px-2 py-2 overflow-auto">
        {cfg.nav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === `/${user.role}`}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `lv-nav-link ${isActive ? "active" : ""}`
            }
          >
            <span style={{ fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ borderTop: "1px solid var(--lv-border)" }}>
        <div className="d-flex align-items-center gap-2 px-3 py-3">
          <div
            className="d-flex align-items-center justify-content-center rounded flex-shrink-0 fw-bold"
            style={{
              width: 32, height: 32,
              background: "var(--lv-gold-bg)",
              border: "1px solid var(--lv-gold-border)",
              color: "var(--lv-gold)",
              fontSize: 13,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="overflow-hidden flex-grow-1">
                <div className="fw-medium text-truncate" style={{ fontSize: 13, color: "var(--lv-text)" }}>{user.name}</div>
                <div className="text-truncate" style={{ fontSize: 11, color: "var(--lv-text-muted)" }}>{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="btn p-1 border-0"
                style={{ color: "var(--lv-text-subtle)", fontSize: 16 }}
                title="Đăng xuất"
              >
                ⏻
              </button>
            </>
          )}
        </div>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-100 border-0 py-2 d-flex align-items-center justify-content-center"
          style={{
            background: "transparent",
            borderTop: "1px solid var(--lv-border)",
            color: "var(--lv-text-subtle)",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--lv-bg-hover)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ display: "inline-block", transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>‹</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="d-flex" style={{ minHeight: "100vh", background: "var(--lv-bg-base)" }}>
      {/* Desktop Sidebar */}
      <aside
        className="d-none d-lg-flex flex-column flex-shrink-0"
        style={{
          width: collapsed ? 64 : 240,
          background: "var(--lv-bg-deep)",
          borderRight: "1px solid var(--lv-border)",
          transition: "width 0.2s ease",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1040, background: "rgba(6,11,20,0.8)" }}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="h-100 d-flex flex-column"
            style={{ width: 240, background: "var(--lv-bg-deep)", borderRight: "1px solid var(--lv-border)" }}
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Top bar */}
        <header
          className="d-flex align-items-center justify-content-between px-4 py-3 flex-shrink-0"
          style={{ background: "var(--lv-bg-surface)", borderBottom: "1px solid var(--lv-border)" }}
        >
          <div className="d-flex align-items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="d-lg-none btn p-1 border-0"
              style={{ color: "var(--lv-text-muted)", fontSize: 20 }}
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>
            <div className="d-flex align-items-center gap-2">
              <span
                className="rounded-circle d-inline-block"
                style={{ width: 8, height: 8, background: "var(--lv-success)" }}
              />
              <span style={{ fontSize: 11, color: "var(--lv-text-muted)", fontFamily: "monospace" }}>
                Kết nối bảo mật · AES-256-GCM
              </span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="d-none d-md-block" style={{ fontSize: 11, color: "var(--lv-text-subtle)", fontFamily: "monospace" }}>
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span
              className="px-3 py-1 rounded"
              style={{ background: "var(--lv-gold-bg)", border: "1px solid var(--lv-gold-border)", color: "var(--lv-gold)", fontSize: 12, fontFamily: "monospace" }}
            >
              🔒 Vault Active
            </span>
            <button
              onClick={toggleTheme}
              className="btn p-1 border-0 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 32, height: 32, background: "var(--lv-bg-hover)", color: "var(--lv-text-muted)" }}
              title={theme === 'dark' ? "Chế độ Sáng" : "Chế độ Tối"}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              className="d-lg-none btn py-1 px-2 border-0 rounded"
              onClick={handleLogout}
              style={{ color: "var(--lv-text-muted)", fontSize: 13 }}
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-grow-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
