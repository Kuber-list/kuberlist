import { useEffect, useState } from "react";

export const Spinner = ({ size = "md", className = "" }) => {
  const s = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-8 h-8" };
  return (
    <div
      className={`${s[size]} border-2 border-border border-t-navy rounded-full anim-spin ${className}`}
    />
  );
};

export const Alert = ({ type = "error", message, onClose }) => {
  if (!message) return null;
  const map = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-green-50 border-green-200 text-green-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <div
      className={`border px-4 py-3 text-sm flex items-start gap-3 mb-4 ${map[type]}`}
    >
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="opacity-50 hover:opacity-100 flex-shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export const EmptyState = ({ icon = "📋", title, description, action }) => (
  <div className="flex flex-col items-center py-20 text-center">
    <div className="text-5xl mb-4 opacity-25">{icon}</div>
    <h3 className="font-display text-xl font-semibold text-navy mb-2">
      {title}
    </h3>
    {description && (
      <p className="text-muted text-sm max-w-xs mb-6 leading-relaxed">
        {description}
      </p>
    )}
    {action}
  </div>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="page-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy leading-tight">
        {title}
      </h1>
      {subtitle && <p className="text-muted text-sm mt-1.5">{subtitle}</p>}
    </div>
    {actions && (
      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        {actions}
      </div>
    )}
  </div>
);

export const Modal = ({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}) => {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-navy/40 backdrop-blur-sm anim-in"
          onClick={onClose}
        />

        <div
          className={`relative bg-white border border-border w-full ${maxWidth} max-h-[90vh] overflow-hidden anim-up shadow-modal rounded-lg`}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <h3 className="font-display text-xl font-semibold text-navy">
              {title}
            </h3>

            <button
              onClick={onClose}
              className="text-muted hover:text-navy text-lg leading-none ml-4"
            >
              ✕
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
export const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-outline btn-sm disabled:opacity-30"
      >
        ← Prev
      </button>
      <span className="text-xs text-muted font-mono px-3">
        Page {page} of {pages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="btn-outline btn-sm disabled:opacity-30"
      >
        Next →
      </button>
    </div>
  );
};

export const LoadingPage = () => (
  <div className="flex items-center justify-center min-h-screen bg-bg">
    <div className="flex flex-col items-center gap-4">
      <img
        src="/logo.png"
        alt="KuberList"
        className="w-14 h-14 object-contain opacity-60"
      />
      <Spinner size="lg" />
    </div>
  </div>
);

export const StatCard = ({ label, value, sub, icon, color = "#022440" }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
          {label}
        </p>
        <p className="font-mono text-3xl font-bold" style={{ color }}>
          {value ?? "—"}
        </p>
        {sub && <p className="text-xs text-muted mt-1.5">{sub}</p>}
      </div>
      {icon && (
        <div className="opacity-20 text-muted">
          {(() => {
            const Icon = icon;
            return <Icon size={48} strokeWidth={1.5} />;
          })()}
        </div>
      )}
    </div>
  </div>
);

export const ScoreRing = ({ score, size = 100 }) => {
  const [anim, setAnim] = useState(0);
  const total = score?.total_score || 0;
  const color =
    total >= 80
      ? "#677555"
      : total >= 65
        ? "#022440"
        : total >= 50
          ? "#CEAE5E"
          : total >= 35
            ? "#B45309"
            : "#DC2626";
  const r2 = (size - 12) / 2;
  const circ = 2 * Math.PI * r2;
  useEffect(() => {
    let raf,
      start = null;
    const run = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1000, 1);
      setAnim(Math.round((1 - Math.pow(1 - p, 3)) * total));
      if (p < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [total]);
  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r2}
          fill="none"
          stroke="#E2E4DF"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r2}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${(anim / 100) * circ} ${circ}`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "JetBrains Mono,monospace",
            fontSize: size > 90 ? 20 : 14,
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {anim}
        </span>
        <span style={{ fontSize: 9, color: "#9CA3AF", marginTop: 2 }}>
          /100
        </span>
      </div>
    </div>
  );
};

export const ScoreBar = ({
  label,
  value,
  max = 20,
  color = "#CEAE5E",
  delay = 0,
}) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW((value / max) * 100), delay + 80);
    return () => clearTimeout(t);
  }, [value, max, delay]);
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted uppercase tracking-wider font-medium">
          {label}
        </span>
        <span className="font-mono text-xs font-semibold" style={{ color }}>
          {value}
          <span className="text-dim font-normal">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 bg-border overflow-hidden rounded-full">
        <div
          style={{
            height: "100%",
            width: `${w}%`,
            background: color,
            transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)",
            borderRadius: "9999px",
          }}
        />
      </div>
    </div>
  );
};

export const GradeBadge = ({ grade }) => {
  const map = {
    A: "badge-olive",
    B: "badge-navy",
    C: "badge-gold",
    D: "badge-amber",
    E: "badge-red",
  };
  return <span className={map[grade] || "badge-gray"}>Grade {grade}</span>;
};

const STATUS_COLORS = {
  DRAFT: "badge-gray",
  ACTIVE: "badge-olive",
  INACTIVE: "badge-gray",
  UNDER_REVIEW: "badge-amber",
  PENDING: "badge-amber",
  ACCEPTED: "badge-olive",
  REJECTED: "badge-red",
};
export const StatusBadge = ({ status }) => (
  <span className={STATUS_COLORS[status] || "badge-gray"}>
    {(status || "—").replace(/_/g, " ")}
  </span>
);

export const formatINR = (n) => {
  if (!n) return "—";
  const v = Number(n);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toLocaleString("en-IN")}`;
};

export const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
