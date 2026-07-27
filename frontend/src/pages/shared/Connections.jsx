import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { connectionAPI } from "../../api/index.js";
import {
  PageHeader,
  Spinner,
  EmptyState,
  formatDate,
  formatINR,
  GradeBadge,
} from "../../components/ui/index.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { imageUrl } from "../../utils/image";
const STAGES = [
  { key: "ACCEPTED", label: "Accepted", color: "#677555" },
  { key: "INTRO_CALL", label: "Intro Call", color: "#022440" },
  { key: "MEETING", label: "Meeting", color: "#CEAE5E" },
  { key: "DUE_DILIGENCE", label: "Due Diligence", color: "#B45309" },
  { key: "TERM_SHEET", label: "Term Sheet", color: "#7C3AED" },
  { key: "CLOSED", label: "Closed ✓", color: "#059669" },
  { key: "DROPPED", label: "Dropped", color: "#DC2626" },
];

// Pipeline stage counts
function PipelineSummary({ connections }) {
  const counts = {};
  STAGES.forEach((s) => {
    counts[s.key] = connections.filter((c) => c.deal_stage === s.key).length;
  });
  return (
    <div className="card mb-5 overflow-hidden p-0">
      <div className="grid grid-cols-7">
        {STAGES.map((s, i) => (
          <div
            key={s.key}
            className={`text-center py-3 px-1 ${i < STAGES.length - 1 ? "border-r border-border" : ""}`}
          >
            <div
              className="font-mono text-lg font-bold"
              style={{ color: s.color }}
            >
              {counts[s.key]}
            </div>
            <div className="text-xs text-dim mt-0.5 leading-tight">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Connections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ACTIVE");

  useEffect(() => {
    if (!user?.id) return;
    connectionAPI
      .getMyConnections(user.id)
      .then((r) => setConnections(r.data.data))
      .finally(() => setLoading(false));
  }, [user]);

  const displayed =
    filter === "ALL"
      ? connections
      : connections.filter((c) =>
          filter === "ACTIVE" ? c.status === "ACTIVE" : c.status === "CLOSED",
        );

  const isSeeker = user?.role === "CAPITAL_SEEKER";

  return (
    <div className="anim-up">
      <PageHeader
        title="Deal Pipeline"
        subtitle={`${connections.length} connection${connections.length !== 1 ? "s" : ""} total`}
      />

      {connections.length > 0 && <PipelineSummary connections={connections} />}

      <div className="flex gap-2 mb-5">
        {[
          [
            "ACTIVE",
            `Active (${connections.filter((c) => c.status === "ACTIVE").length})`,
          ],
          [
            "CLOSED",
            `Closed (${connections.filter((c) => c.status === "CLOSED").length})`,
          ],
          ["ALL", `All (${connections.length})`],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-4 py-1.5 text-xs font-semibold border transition-all duration-150 ${filter === v ? "border-navy bg-navy/10 text-navy" : "border-border text-muted hover:border-navy/30"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No connections yet"
          description={
            isSeeker
              ? "Accept an investor's interest to start a connection."
              : "Express interest in a listing. When accepted, a connection is created."
          }
          action={
            !isSeeker && (
              <Link to="/investor/discover" className="btn-navy inline-flex">
                Browse Listings →
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-3 stagger">
          {displayed.map((c) => {
            const other = isSeeker ? c.investor : c.seeker;
            const stageInfo =
              STAGES.find((s) => s.key === c.deal_stage) || STAGES[0];
            const score = c.listing?.score;
            return (
              <div
                key={c.id}
                className="card hover:border-gold/40 hover:shadow-gold transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 flex-shrink-0">
                    {other?.profile_image_url ? (
                      <img
                        src={imageUrl(other.profile_image_url)}
                        alt={other?.name}
                        className="w-8 h-8 rounded-full object-cover border border-gold/40"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gold/20 border border-gold/40 rounded-full flex items-center justify-center text-gold font-display font-bold text-sm">
                        {other?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                      <div>
                        <h3 className="font-display text-base font-semibold text-navy">
                          {c.listing?.name}
                        </h3>
                        <p className="text-xs text-muted">
                          {isSeeker ? "Investor" : "Capital Seeker"}:{" "}
                          <span className="font-medium text-text">
                            {other?.name}
                          </span>
                        </p>
                      </div>
                      <span
                        className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider border flex-shrink-0"
                        style={{
                          color: stageInfo.color,
                          borderColor: stageInfo.color,
                          background: `${stageInfo.color}12`,
                        }}
                      >
                        {stageInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-dim mt-2 flex-wrap">
                      <span>{c.listing?.sector}</span>
                      <span>{formatINR(c.listing?.funding_ask)}</span>
                      <span>{c._count?.messages || 0} messages</span>
                      {score?.grade && <GradeBadge grade={score.grade} />}
                      {score?.decision && (
                        <span
                          className="font-semibold"
                          style={{
                            color: {
                              STRONG_BUY: "#059669",
                              INVESTIGATE: "#022440",
                              WATCH: "#B45309",
                              PASS: "#DC2626",
                            }[score.decision],
                          }}
                        >
                          {score.decision?.replace(/_/g, " ")}
                        </span>
                      )}
                      <span>Connected {formatDate(c.created_at)}</span>
                    </div>
                    {c.outcome && (
                      <span
                        className={`mt-2 inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 ${c.outcome === "WON" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
                      >
                        {c.outcome}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/connections/${c.id}`)}
                    className="btn-navy btn-sm flex-shrink-0"
                  >
                    Open →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
