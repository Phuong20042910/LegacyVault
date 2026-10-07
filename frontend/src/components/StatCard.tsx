interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: string;
  colorBg?: string;
  sub?: string;
}

export default function StatCard({ label, value, icon, color = "var(--lv-gold)", colorBg, sub }: StatCardProps) {
  return (
    <div
      className="lv-stat-card d-flex align-items-center gap-3"
    >
      <div
        className="d-flex align-items-center justify-content-center rounded-lv flex-shrink-0"
        style={{
          width: 48, height: 48,
          background: colorBg || "var(--lv-gold-bg)",
          border: `1px solid ${colorBg ? color + "40" : "var(--lv-gold-border)"}`,
          fontSize: 22,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: "var(--lv-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>
          {label}
        </div>
        <div className="fw-bold mt-1" style={{ fontSize: "1.6rem", color: color, lineHeight: 1 }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 11, color: "var(--lv-text-subtle)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}
