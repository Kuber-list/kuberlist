import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { scoreAPI } from "../../api/index.js";
import {
  PageHeader,
  Spinner,
  Alert,
  ScoreRing,
  ScoreBar,
  GradeBadge,
} from "../../components/ui/index.jsx";

const DIMS = [
  {
    key: "traction_score",
    label: "Traction & POs",
    max: 30,
    color: "#022440",
    tips: [
      "Add confirmed purchase orders (+8 pts)",
      "Enter PO value and count",
      "Add revenue figures",
      "Post company updates",
    ],
  },
  {
    key: "financial_score",
    label: "Financial Health",
    max: 30,
    color: "#677555",
    tips: [
      "Define monthly burn rate",
      "Maintain healthy burn ratio (revenue > 2x annual burn)",
      "Add valuation expectation",
      "Ensure 12+ months runway",
    ],
  },
  {
    key: "narrative_score",
    label: "Narrative (Context + Trust)",
    max: 43,
    color: "#CEAE5E",
    tips: [
      "Upload financial model",
      "Add accelerator/incubator membership",
      "Provide purchase orders",
      "Complete founder LinkedIn and bio",
    ],
  },
  {
    key: "business_maturity_score",
    label: "Business Maturity",
    max: 10,
    color: "#022440",
    tips: [],
  },
  {
    key: "market_score",
    label: "Market Opportunity",
    max: 10,
    color: "#677555",
    tips: [],
  },
  {
    key: "founder_score",
    label: "Founder Profile",
    max: 5,
    color: "#CEAE5E",
    tips: [],
  },
  {
    key: "credibility_score",
    label: "Credibility",
    max: 10,
    color: "#059669",
    tips: [],
  },
  {
    key: "readiness_score",
    label: "Readiness",
    max: 8,
    color: "#7C3AED",
    tips: [],
  },
];

const DECISION_STYLES = {
  HIGH_READINESS: {
    label: "High Readiness",
    color: "#059669",
    bg: "#F0FDF4",
    border: "#86EFAC",
  },
  HIGH_POTENTIAL: {
    label: "High Potential",
    color: "#022440",
    bg: "#EFF6FF",
    border: "#93C5FD",
  },
  DEVELOPING: {
    label: "Developing",
    color: "#B45309",
    bg: "#FFFBEB",
    border: "#FCD34D",
  },
  EARLY_STAGE: {
    label: "Early Stage",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FCA5A5",
  },
};

function getCategory(total) {
  if (total >= 85) return { label: "Deal Ready", color: "#059669" };
  if (total >= 70) return { label: "Investor Ready", color: "#677555" };
  if (total >= 55) return { label: "Strong Potential", color: "#022440" };
  if (total >= 40) return { label: "Developing", color: "#CEAE5E" };
  if (total >= 25) return { label: "Early Stage", color: "#B45309" };
  return { label: "Needs Work", color: "#DC2626" };
}

export default function ListingScore() {
  const { id } = useParams();
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState("");

  const compute = async () => {
    setComputing(true);
    setError("");
    try {
      const r = await scoreAPI.getScore(id);
      setScore(r.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to compute score");
    } finally {
      setComputing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    compute();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );

  const cat = score ? getCategory(score.total_score) : null;
  const decision = score?.decision;
  const ds = decision ? DECISION_STYLES[decision] : null;

  return (
    <div className="anim-up">
      <PageHeader
        title="Readiness Score"
        subtitle="V4 intelligence scoring — Hard + Narrative + Confidence + Risk + Momentum"
        actions={
          <div className="flex gap-2">
            <button
              onClick={compute}
              disabled={computing}
              className="btn-outline btn-sm flex items-center gap-1.5"
            >
              {computing ? <Spinner size="sm" /> : "⟳"} Recalculate
            </button>
            <Link
              to={`/seeker/listings/${id}/report`}
              className="btn-navy btn-sm"
            >
              Full Report →
            </Link>
          </div>
        }
      />
      <Alert type="error" message={error} onClose={() => setError("")} />

      {score && (
        <>
          {/* Hero */}
          <div className="card mb-5 bg-navy border-0">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ScoreRing score={score} size={120} />
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start flex-wrap">
                  <span
                    className="font-mono text-5xl font-bold"
                    style={{ color: cat.color }}
                  >
                    {score.total_score}
                  </span>
                  <span className="text-white/30 text-2xl">/100</span>
                  <GradeBadge grade={score.grade} />
                  {ds && (
                    <span
                      className="text-xs font-bold uppercase tracking-wider px-3 py-1 border"
                      style={{
                        color: ds.color,
                        background: ds.bg,
                        borderColor: ds.border,
                      }}
                    >
                      {ds.label}
                    </span>
                  )}
                </div>
                <p
                  className="font-semibold text-sm mb-1"
                  style={{ color: cat.color }}
                >
                  {cat.label}
                </p>
                {score.verdict && (
                  <p className="text-white/50 text-xs italic mb-2">
                    "{score.verdict}"
                  </p>
                )}
                <p className="text-white/30 text-xs">
                  Updated:{" "}
                  {new Date(score.last_updated || Date.now()).toLocaleString(
                    "en-IN",
                  )}
                </p>
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    <strong>Disclaimer:</strong> This readiness score is
                    generated automatically using information provided by the
                    startup and KuberList's evaluation criteria. It is intended
                    to assist discovery and comparison only. It does not
                    constitute investment advice, investment research, or a
                    recommendation to invest. Investors should conduct their own
                    independent due diligence before making investment
                    decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* V4 Metrics row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              [
                "Hard Score",
                `${score.hard_score}/60`,
                "#022440",
                "Traction + Financials",
              ],
              [
                "Narrative",
                `${score.narrative_score}/43`,
                "#677555",
                "Context + Trust",
              ],
              [
                "Confidence",
                `${score.confidence_label}`,
                score.confidence_label === "High"
                  ? "#059669"
                  : score.confidence_label === "Medium"
                    ? "#B45309"
                    : "#DC2626",
                `${score.confidence_score}% data verified`,
              ],
              [
                "Risk",
                `${score.risk_score}`,
                score.risk_score < 20
                  ? "#059669"
                  : score.risk_score < 40
                    ? "#B45309"
                    : "#DC2626",
                "Lower is better",
              ],
            ].map(([label, value, color, sub]) => (
              <div key={label} className="card text-center py-4">
                <p className="text-xs text-muted uppercase tracking-wider mb-1">
                  {label}
                </p>
                <p className="font-mono text-xl font-bold" style={{ color }}>
                  {value}
                </p>
                <p className="text-xs text-dim mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Drivers & Risks */}
          {(score.top_drivers?.length > 0 || score.top_risks?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
              {score.top_drivers?.length > 0 && (
                <div className="card border-olive/25 bg-olive/5">
                  <h3 className="font-display text-sm font-semibold text-olive uppercase tracking-wider mb-3">
                    ✅ What's Working
                  </h3>
                  <ul className="space-y-2">
                    {score.top_drivers.map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-2 text-sm text-text"
                      >
                        <span className="text-olive font-bold flex-shrink-0">
                          →
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {score.top_risks?.length > 0 && (
                <div className="card border-red-200 bg-red-50/50">
                  <h3 className="font-display text-sm font-semibold text-red-600 uppercase tracking-wider mb-3">
                    ⚠️ Investor Risks
                  </h3>
                  <ul className="space-y-2">
                    {score.top_risks.map((r) => (
                      <li
                        key={r}
                        className="flex items-start gap-2 text-sm text-text"
                      >
                        <span className="text-red-500 font-bold flex-shrink-0">
                          →
                        </span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Score dimensions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            {DIMS.map((dim, i) => (
              <div key={dim.key} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-base font-semibold text-navy">
                    {dim.label}
                  </h3>
                  <span
                    className="font-mono text-xl font-bold"
                    style={{ color: dim.color }}
                  >
                    {score[dim.key]}
                    <span className="text-dim text-sm font-normal">
                      /{dim.max}
                    </span>
                  </span>
                </div>
                <ScoreBar
                  label=""
                  value={score[dim.key]}
                  max={dim.max}
                  color={dim.color}
                  delay={i * 100}
                />
                {score[dim.key] < dim.max * 0.7 && (
                  <>
                    {dim.tips.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted font-semibold mb-1.5 uppercase tracking-wider">
                          How to improve:
                        </p>

                        <ul className="space-y-1">
                          {dim.tips.map((tip) => (
                            <li
                              key={tip}
                              className="text-xs text-muted flex items-start gap-1.5"
                            >
                              <span className="text-gold mt-0.5 flex-shrink-0">
                                →
                              </span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {score.improvements?.filter(
                      (imp) => imp.dimension === dim.key,
                    ).length > 0 && (
                      <div
                        className={
                          dim.tips.length > 0
                            ? "mt-2"
                            : "mt-3 pt-3 border-t border-border"
                        }
                      >
                        {dim.tips.length === 0 && (
                          <p className="text-xs text-muted font-semibold mb-1.5 uppercase tracking-wider">
                            How to improve:
                          </p>
                        )}

                        <ul className="space-y-1">
                          {score.improvements
                            .filter((imp) => imp.dimension === dim.key)
                            .map((imp) => (
                              <li
                                key={imp.action}
                                className="text-xs text-muted flex items-start gap-1.5"
                              >
                                <span className="text-gold mt-0.5 flex-shrink-0">
                                  →
                                </span>
                                {imp.action}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Improvement suggestions */}
          {score.improvements?.length > 0 && (
            <div className="card mb-5 border-gold/25">
              <h3 className="font-display text-base font-semibold text-navy mb-4">
                🎯 Priority Actions to Improve Score
              </h3>
              <div className="space-y-2">
                {score.improvements.map((imp, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-bg border border-border"
                  >
                    <span className="w-6 h-6 bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">
                        {imp.action}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-navy bg-gold/15 border border-gold/30 rounded-full px-3 py-1 whitespace-nowrap">
                      {imp.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <Link to={`/seeker/listings/${id}/report`} className="btn-navy">
              Generate Full Report →
            </Link>
            <Link to={`/seeker/listings/${id}/edit`} className="btn-outline">
              Edit Listing
            </Link>
            <Link to={`/seeker/listings/${id}`} className="btn-ghost">
              ← Back
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
