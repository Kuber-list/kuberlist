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

const SCORE_DIMS = [
  {
    key: "traction_score",
    label: "Traction",
    color: "#B45309",
    max: 30,
  },
  {
    key: "financial_score",
    label: "Financials",
    color: "#CEAE5E",
    max: 30,
  },
  {
    key: "hard_score",
    label: "Hard Score",
    color: "#022440",
    max: 60,
  },
  {
    key: "narrative_score",
    label: "Narrative",
    color: "#677555",
    max: 43,
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
  {
    key: "confidence_score",
    label: "Confidence",
    color: "#059669",
    max: 100,
  },
  {
    key: "risk_score",
    label: "Risk",
    color: "#DC2626",
    max: 100,
  },
  {
    key: "momentum_score",
    label: "Momentum",
    color: "#7C3AED",
    max: 10,
  },
];
const FUNDAMENTAL_DIMS = [
  "traction_score",
  "financial_score",
  "business_maturity_score",
  "market_score",
  "founder_score",
  "credibility_score",
];

const INTELLIGENCE_DIMS = [
  "readiness_score",
  "hard_score",
  "narrative_score",
  "confidence_score",
  "risk_score",
  "momentum_score",
];

export default function ListingReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");

  const generate = async () => {
    setGenerating(true);
    setError("");

    try {
      const r = await scoreAPI.getReport(id);
      setReport(r.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate report");
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };
  useEffect(() => {
    generate();
  }, [id]);

  const exportPDF = () => {
    if (!report) return;
    const s = report.score;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>KuberList Investment Intelligence Report — ${report.metadata.listing_name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'DM Sans',sans-serif;background:#fff;color:#111827;font-size:13px}
      .page{max-width:800px;margin:0 auto;padding:48px 40px}
      .watermark{
    position:fixed;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    width:420px;
    opacity:0.045;
    z-index:0;
    pointer-events:none;
}

.content{
    position:relative;
    z-index:2;
}
      .header{border-bottom:3px solid #022440;padding-bottom:20px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-start}
      .brand{display:flex;align-items:center;gap:8px}
      .brand-name{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:700;color:#022440}
      h1{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:700;color:#022440;margin-bottom:4px}
      .meta{color:#6b7280;font-size:12px;margin-bottom:4px}
      .score-banner{background:#022440;color:white;padding:20px 24px;margin-bottom:24px;display:flex;gap:32px;align-items:center}
      .score-num{font-family:'DM Sans',monospace;font-size:52px;font-weight:700;color:#CEAE5E;line-height:1}
      .score-label{font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.1em}
      .score-cat{font-size:14px;font-weight:600;color:#CEAE5E;margin-top:4px}
     .dims{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:12px;
margin-bottom:24px;
}
      .dim{background:#f8f9f6;border:1px solid #e2e4df;padding:12px;text-align:center}
      .dim-val{font-size:22px;font-weight:700;margin-bottom:2px}
      .dim-name{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;line-height:1.3}
      .section{margin-bottom:20px;break-inside:avoid}
      .section-head{display:flex;align-items:center;gap:8px;border-bottom:1px solid #e2e4df;padding-bottom:8px;margin-bottom:10px}
      .section-icon{font-size:16px}
      .section-title{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600;color:#022440}
      .section-body{color:#374151;line-height:1.7;font-size:13px}
      .footer{margin-top:36px;padding-top:16px;border-top:1px solid #e2e4df;display:flex;justify-content:space-between;font-size:11px;color:#9ca3af}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body><body>

<div class="watermark">
    <img
        src="/logo.png"
        style="width:100%;height:auto;"
    />
</div>

<div class="page content">
    <div class="header">
      <div>
        <h1>${report.metadata.listing_name}</h1>
        <div class="meta">${report.metadata.sector} · ${(report.metadata.stage || "").replace(/_/g, " ")} · ${report.metadata.entity_type}</div>
        <div class="meta">Generated: ${new Date(report.metadata.generated_at).toLocaleString("en-IN")}</div>
      </div>
      <div class="brand"><div class="brand-name">KuberList</div></div>
    </div>
    <div class="score-banner">
      <div><div class="score-label">Readiness Score</div><div class="score-num">${s.total_score}</div><div style="color:#9CA3AF;font-size:12px">/100</div></div>
      <div><div class="score-label">Category</div><div class="score-cat">${s.category}</div><div class="score-label" style="margin-top:4px">Grade ${s.grade || ""}</div></div>
    </div>
    <div class="section">
  <div class="section-head">
    <span class="section-icon">📋</span>
    <span class="section-title">Executive Summary</span>
  </div>

  <div class="section-body">

    <p style="margin-bottom:12px;">
      <strong>Overall Assessment</strong><br>
      ${s.verdict || report.score.category_description}
    </p>

    <p style="margin-bottom:12px;">
      <strong>Investment Recommendation</strong><br>
      ${s.verdict || s.category}
    </p>

    ${
      s.top_drivers?.length
        ? `
        <p style="margin-bottom:6px;"><strong>Key Strengths</strong></p>
        <ul style="margin:0 0 12px 20px;">
          ${s.top_drivers
            .slice(0, 3)
            .map((d) => `<li>${d}</li>`)
            .join("")}
        </ul>
        `
        : ""
    }

    ${
      s.top_risks?.length
        ? `
        <p style="margin-bottom:6px;"><strong>Primary Risks</strong></p>
        <ul style="margin:0 0 12px 20px;">
          ${s.top_risks
            .slice(0, 3)
            .map((r) => `<li>${r}</li>`)
            .join("")}
        </ul>
        `
        : ""
    }

  </div>
</div>
   <div class="section">
  <div class="section-head">
    <span class="section-icon">📊</span>
    <span class="section-title">Investment Fundamentals</span>
  </div>

  <div class="dims">
    ${SCORE_DIMS.filter((d) => FUNDAMENTAL_DIMS.includes(d.key))
      .map(
        (d) => `
        <div class="dim">
          <div class="dim-val" style="color:${d.color}">
            ${s[d.key] || 0}
          </div>
          <div class="dim-name">${d.label}</div>
        </div>
      `,
      )
      .join("")}
  </div>
</div>

<div class="section">
  <div class="section-head">
    <span class="section-icon">🧠</span>
    <span class="section-title">Investment Intelligence</span>
  </div>

  <div class="dims">
    ${SCORE_DIMS.filter((d) => INTELLIGENCE_DIMS.includes(d.key))
      .map(
        (d) => `
      <div class="dim">
        <div class="dim-val" style="color:${d.color}">
          ${s[d.key] || 0}
        </div>
        <div class="dim-name">${d.label}</div>
      </div>
    `,
      )
      .join("")}
  </div>
</div>
    ${report.sections
      .map(
        (sec) => `
      <div class="section">
        <div class="section-head"><span class="section-icon">${sec.icon}</span><span class="section-title">${sec.title}</span></div>
        <div class="section-body">${sec.content}</div>
      </div>`,
      )
      .join("")}
    <div class="section">

<div class="section-head">

<span class="section-icon">⚖️</span>

<span class="section-title">
Disclaimer
</span>

</div>

<div class="section-body">

This report has been generated by the
KuberList Investment Intelligence Engine.

The score is intended as a
decision-support tool and should not replace
independent commercial,
financial,
legal,
or technical due diligence.

Investment decisions remain solely
the responsibility of the investor.

</div>

</div>
      <div class="footer">
      <span>KuberList Investment Intelligence Report — Confidential</span>
      <span>kuberlist.in · ${new Date().getFullYear()}</span>
    </div>
    </div></body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="anim-up">
      <PageHeader
        title="Investment Intelligence Report"
        subtitle={
          report
            ? `${report.metadata.listing_name} · Generated ${new Date(report.metadata.generated_at).toLocaleString("en-IN")}`
            : "Generating…"
        }
        actions={
          <div className="flex gap-2">
            <button
              onClick={generate}
              disabled={generating}
              className="btn-outline btn-sm flex items-center gap-1.5"
            >
              {generating ? <Spinner size="sm" /> : "⟳"} Regenerate
            </button>
            {report && (
              <button onClick={exportPDF} className="btn-navy btn-sm">
                ↓ Export PDF
              </button>
            )}
          </div>
        }
      />

      <Alert type="error" message={error} onClose={() => setError("")} />

      {report && (
        <>
          {/* Score summary */}
          <div className="card mb-6 border-navy/20 bg-navy/5">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={report.score} size={110} />
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start flex-wrap">
                  <span className="font-mono text-4xl font-bold text-navy">
                    {report.score.total_score}
                  </span>
                  <span className="text-dim text-xl">/100</span>
                  <GradeBadge grade={report.score.grade} />
                </div>
                <p className="text-navy font-semibold text-sm mb-1">
                  {report.score.category}
                </p>
                <p className="text-muted text-xs">
                  {report.score.category_description}
                </p>
              </div>
              <div className="w-full sm:w-[520px] grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-display text-sm font-semibold text-navy mb-3 border-b border-border pb-1">
                    📊 Investment Fundamentals
                  </h4>

                  <div className="space-y-2">
                    {SCORE_DIMS.filter((d) =>
                      FUNDAMENTAL_DIMS.includes(d.key),
                    ).map((d, i) => (
                      <ScoreBar
                        key={d.key}
                        label={d.label}
                        value={report.score[d.key] || 0}
                        max={d.max}
                        color={d.color}
                        delay={i * 80}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-display text-sm font-semibold text-navy mb-3 border-b border-border pb-1">
                    📈 Investment Assessment
                  </h4>

                  <div className="space-y-2">
                    {SCORE_DIMS.filter((d) =>
                      INTELLIGENCE_DIMS.includes(d.key),
                    ).map((d, i) => (
                      <ScoreBar
                        key={d.key}
                        label={d.label}
                        value={report.score[d.key] || 0}
                        max={d.max}
                        color={d.color}
                        delay={(i + 6) * 80}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Report sections */}
          <div className="space-y-4 mb-6">
            {report.sections.map((sec, i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-3 pb-3 mb-4 border-b border-border">
                  <span className="text-2xl">{sec.icon}</span>
                  <h3 className="font-display text-lg font-semibold text-navy">
                    {sec.title}
                  </h3>
                </div>
                <p className="text-muted text-sm leading-relaxed">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={exportPDF}
              className="btn-navy flex items-center gap-2"
            >
              ↓ Export PDF Report
            </button>
            <Link to={`/seeker/listings/${id}/score`} className="btn-outline">
              View Score Details
            </Link>
            <Link to={`/seeker/listings/${id}`} className="btn-ghost">
              ← Back to Listing
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
