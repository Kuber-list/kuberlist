/**
 * KuberList Scoring Engine V4
 *
 * Output:
 *   quality          — base business quality (0-100)
 *   confidence_score — data completeness + verification (0-100)
 *   risk_score       — penalty signals (0-100, lower = less risk)
 *   momentum_score   — rate of change (0-10)
 *   total_score      — final blended score
 *
 * Formula:
 *  // NEW
let raw =quality * (0.5 + 0.5 * (confidence_score / 100)) -
  0.3 * risk_score;
 *   if hard_score < 35: raw *= (hard_score / 35)   ← smooth suppression
 *
 * Signal ownership (no double-counting):
 *   Revenue amount  → Traction
 *   Burn/runway     → Financials (ratios only)
 *   Doc presence    → Readiness/Confidence
 *   Delta/change    → Momentum
 */

const HIGH_GROWTH_SECTORS = [
  "FinTech",
  "AI/ML",
  "HealthTech",
  "SaaS",
  "CleanTech",
  "AgriTech",
  "EdTech",
];
const KNOWN_ACCELERATORS = [
  "Y Combinator",
  "YC",
  "TiE",
  "Startup India",
  "NASSCOM",
  "100X.VC",
  "Sequoia Surge",
  "Google for Startups",
  "Microsoft for Startups",
  "IIM Incubator",
  "IIT Incubator",
  "SIDBI",
  "Axilor",
  "Antler",
  "Venture Catalysts",
  "ah! Ventures",
];
import { analyzeNarrative } from "./narrativeAnalysis.js";
const cap = (v, max) => Math.min(Math.max(v, 0), max);
export const fmt = (n) => {
  if (!n) return null;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

// ── HARD SCORE (60 pts) ──────────────────────────────────────────
function scoreTraction(listing, updateCount) {
  let pts = 0;
  if (listing.has_purchase_orders) {
    pts += 8;
    const pov = listing.po_value || 0;
    if (pov >= 500000) pts += 5;
    if (pov >= 5000000) pts += 7;
    if ((listing.po_count || 0) > 3) pts += 3;
  }
  const rev = listing.revenue_last_year || 0;
  if (rev > 0) pts += 3;
  if (rev >= 1000000) pts += 2;
  if (rev >= 10000000) pts += 2;
  if (updateCount > 0) pts += 1;
  if (updateCount >= 3) pts += 1;
  return cap(pts, 30);
}

function scoreFinancials(listing) {
  let pts = 0;
  const rev = listing.revenue_last_year || 0;
  const burn = listing.monthly_burn || 0;
  const ask = listing.funding_ask || 0;
  const val = listing.valuation_expectation || 0;

  if (burn > 0) {
    pts += 5;
    if (rev > 0) {
      const ratio = rev / (burn * 12);
      if (ratio >= 2) pts += 10;
      else if (ratio >= 1) pts += 5;
      else if (ratio >= 0.5) pts += 2;
    }
  }
  if (burn > 0 && ask > 0) {
    const runway = ask / burn;
    if (runway >= 18) pts += 8;
    else if (runway >= 12) pts += 5;
    else if (runway >= 6) pts += 2;
  }
  if (val > 0) {
    pts += 3;
    if (rev > 0 && val / rev <= 10) pts += 4;
  }
  return cap(pts, 30);
}
function scoreBusinessMaturity(listing, narrative) {
  const stageMap = {
    idea: 2,
    pre_seed: 4,
    seed: 6,
    series_a: 8,
    series_b: 10,
    growth: 10,
  };

  let pts = stageMap[listing.stage?.toLowerCase()] || 0;

  if (listing.entity_type === "SME") {
    pts = cap(pts + 2, 10);
  }

  pts += Math.round(narrative.narrative_score * 0.4);

  return cap(pts, 10);
}
function scoreMarket(listing, narrative) {
  let pts = 0;

  // Sector selected
  if (listing.sector) {
    pts += 2;
  }

  // High-growth sector
  if (HIGH_GROWTH_SECTORS.includes(listing.sector)) {
    pts += 2;
  }

  // Strong narrative
  if (narrative.narrative_score >= 6) {
    pts += 2;
  }

  // Revenue traction
  if ((listing.revenue_last_year || 0) > 0) {
    pts += 2;
  }

  // Large geography opportunity
  const txt = `
    ${listing.summary || ""}
    ${listing.use_of_funds || ""}
  `.toLowerCase();

  if (
    txt.includes("india") ||
    txt.includes("pan india") ||
    txt.includes("multiple states") ||
    txt.includes("global") ||
    txt.includes("international")
  ) {
    pts += 2;
  }

  return cap(pts, 10);
}
function scoreFounder(profile) {
  let pts = 0;

  if (profile?.linkedin_url) {
    pts += 2;
  }

  if (profile?.organisation_name) {
    pts += 1;
  }

  if (profile?.experience_summary && profile.experience_summary.length > 50) {
    pts += 2;
  }

  return cap(pts, 5);
}
function scoreCredibility(listing, docTypes) {
  let pts = 0;

  // Government contracts
  const hasGovContractDoc = docTypes.includes("GOVERNMENT_CONTRACT");

  if (hasGovContractDoc || listing.has_government_contract) {
    pts += 2;
  }

  // IP / Patent
  if (listing.has_ip) {
    pts += listing.patent_number ? 2 : 1;
  }

  // Accelerator
  if (listing.accelerator_name) {
    const known = KNOWN_ACCELERATORS.some((a) =>
      listing.accelerator_name.toLowerCase().includes(a.toLowerCase()),
    );

    pts += known ? 2 : 1;
  }

  // Awards
  if ((listing.awards_recognition || "").trim().length > 5) {
    pts += 1;
  }

  // Purchase Orders
  if (listing.has_purchase_orders) {
    pts += 1;
  }

  // Financial Model uploaded
  if (docTypes.includes("FINANCIAL_MODEL")) {
    pts += 1;
  }

  // Revenue generating
  if ((listing.revenue_last_year || 0) > 0) {
    pts += 1;
  }

  return cap(pts, 10);
}
function scoreReadiness(docTypes) {
  let pts = 0;

  if (docTypes.includes("PITCH_DECK")) {
    pts += 4;
  }

  if (docTypes.includes("FINANCIAL_MODEL")) {
    pts += 3;
  }

  if (docTypes.includes("BUSINESS_PLAN")) {
    pts += 2;
  }

  const extra = docTypes.filter(
    (d) => !["PITCH_DECK", "FINANCIAL_MODEL", "BUSINESS_PLAN"].includes(d),
  ).length;

  pts += Math.min(extra, 2);

  return cap(pts, 8);
}

// ── QUALITY (combines hard + narrative) ──────────────────────────
function computeQuality(hardScore, narrativeScore) {
  const raw = hardScore + narrativeScore;
  return Math.round((raw / 103) * 100);
}
// ── CONFIDENCE (0-100) ───────────────────────────────────────────
function computeConfidence(listing, docTypes) {
  let pts = 0;
  const rev = listing.revenue_last_year || 0;
  const hasFinDoc = docTypes.includes("FINANCIAL_MODEL");
  if (rev > 0) pts += hasFinDoc ? 20 : 10;
  if (listing.has_purchase_orders)
    pts += docTypes.some((d) => d === "OTHER" || d === "TERM_SHEET") ? 20 : 10;
  if ((listing.monthly_burn || 0) > 0) pts += 15;
  if (listing.valuation_expectation) pts += 10;
  if (listing.accelerator_name) {
    pts += 5;
  }

  if (docTypes.includes("GOVERNMENT_CONTRACT")) {
    pts += 10;
  } else if (listing.has_government_contract) {
    pts += 5;
  }
  pts += 5; // base

  const daysSince = listing.updated_at
    ? Math.floor((Date.now() - new Date(listing.updated_at)) / 86400000)
    : 999;
  if (daysSince <= 7) pts += 10;
  else if (daysSince <= 30) pts += 5;

  // Soft inconsistency penalties
  if (rev >= 10000000 && !hasFinDoc) pts -= 5;

  return { confidence_score: cap(pts, 100) };
}

// ── RISK (0-100, lower = less risky) ────────────────────────────
// ── RISK (0-100, lower = less risky) ─────────────────────────────
function computeRisk(listing, profile, docTypes, updateCount, confidenceScore) {
  const rev = listing.revenue_last_year || 0;
  const burn = listing.monthly_burn || 0;
  const ask = listing.funding_ask || 0;
  const val = listing.valuation_expectation || 0;

  let commercial = 0;
  let financial = 0;
  let execution = 0;
  let market = 0;
  let verification = 0;

  // =====================================================
  // 1. COMMERCIAL RISK (30)
  // =====================================================

  if (rev === 0) {
    switch ((listing.stage || "").toLowerCase()) {
      case "idea":
        commercial += 4;
        break;
      case "pre_seed":
        commercial += 8;
        break;
      default:
        commercial += 15;
    }
  }

  if (!listing.has_purchase_orders) commercial += 5;

  if (updateCount === 0) commercial += 5;

  if (listing.has_purchase_orders && rev === 0) commercial += 2;

  commercial = cap(commercial, 30);

  // =====================================================
  // 2. FINANCIAL RISK (25)
  // =====================================================

  if (burn > 0 && ask > 0) {
    const runway = ask / burn;

    if (runway < 3) financial += 12;
    else if (runway < 6) financial += 8;
    else if (runway < 12) financial += 4;
  }

  if (burn > 0 && rev > 0 && burn > rev / 12) financial += 8;

  if (val > 0 && rev > 0 && val > rev * 20) financial += 5;

  financial = cap(financial, 25);

  // =====================================================
  // 3. EXECUTION RISK (20)
  // =====================================================

  if (!profile?.experience_summary) execution += 6;

  if (!profile?.linkedin_url) execution += 2;

  if ((listing.stage || "").toLowerCase() === "idea") execution += 6;
  else if ((listing.stage || "").toLowerCase() === "pre_seed") execution += 3;

  if (updateCount === 0) execution += 4;

  execution = cap(execution, 20);

  // =====================================================
  // 4. MARKET RISK (15)
  // =====================================================

  if (!HIGH_GROWTH_SECTORS.includes(listing.sector)) market += 3;

  const narrative = analyzeNarrative(
    `
      ${listing.summary || ""}
      ${listing.use_of_funds || ""}
    `,
    listing,
  );

  if (narrative.narrative_score < 4) market += 5;

  const txt = `
      ${listing.summary || ""}
      ${listing.use_of_funds || ""}
  `.toLowerCase();

  if (
    !txt.includes("india") &&
    !txt.includes("global") &&
    !txt.includes("market") &&
    !txt.includes("customers")
  ) {
    market += 4;
  }

  if (
    !txt.includes("competitive") &&
    !txt.includes("advantage") &&
    !txt.includes("unique") &&
    !txt.includes("differentiator")
  ) {
    market += 3;
  }

  market = cap(market, 15);

  // =====================================================
  // 5. VERIFICATION RISK (10)
  // =====================================================

  if (!docTypes.includes("PITCH_DECK")) verification += 3;

  if (!docTypes.includes("FINANCIAL_MODEL")) verification += 3;

  if (confidenceScore < 50) verification += 4;

  verification = cap(verification, 10);

  // =====================================================
  // FINAL
  // =====================================================

  return cap(commercial + financial + execution + market + verification, 100);
}

// ── MOMENTUM (0-10) ──────────────────────────────────────────────
function computeMomentum(
  listing,
  updateCount,
  prevScore,
  currentTraction,
  currentFinancial,
  currentTotal,
) {
  let pts = 0;
  const daysSinceCreate = listing.created_at
    ? Math.floor((Date.now() - new Date(listing.created_at)) / 86400000)
    : 999;

  // New listing boost (linear decay over 14 days)
  if (daysSinceCreate <= 14) pts += Math.round(8 * (1 - daysSinceCreate / 14));

  // Delta signals
  if (prevScore) {
    if (currentTraction > (prevScore.previous_traction || 0)) pts += 3;

    if (currentFinancial > (prevScore.previous_financial || 0)) pts += 2;

    if (currentTotal - (prevScore.previous_total || 0) >= 5) pts += 2;
  }

  if (updateCount > 0) pts += 2;
  const daysSinceUpdate = listing.updated_at
    ? Math.floor((Date.now() - new Date(listing.updated_at)) / 86400000)
    : 999;
  if (daysSinceUpdate <= 7) pts += 3;

  return cap(pts, 10);
}

// ── GRADE ────────────────────────────────────────────────────────
export function getGrade(total) {
  if (total >= 85)
    return { grade: "A+", label: "Deal Ready", color: "#059669" };
  if (total >= 70)
    return { grade: "A", label: "Investor Ready", color: "#677555" };
  if (total >= 55)
    return { grade: "B", label: "Strong Potential", color: "#022440" };
  if (total >= 40) return { grade: "C", label: "Developing", color: "#CEAE5E" };
  if (total >= 25)
    return { grade: "D", label: "Early Stage", color: "#B45309" };
  return { grade: "E", label: "Needs Work", color: "#DC2626" };
}

// ── MAIN SCORER ──────────────────────────────────────────────────
export function scoreListing(
  listing,
  profile,
  docTypes = [],
  updateCount = 0,
  prevScore = null,
) {
  const traction_score = scoreTraction(listing, updateCount);
  const financial_score = scoreFinancials(listing);
  const hard_score = traction_score + financial_score;

  const narrative = analyzeNarrative(
    `
    ${listing.summary || ""}
    ${listing.use_of_funds || ""}
    ${profile?.experience_summary || ""}
    `,
    listing,
  );

  const business_maturity_score = scoreBusinessMaturity(listing, narrative);

  const market_score = scoreMarket(listing, narrative);

  const founder_score = scoreFounder(profile);

  const credibility_score = scoreCredibility(listing, docTypes);

  const readiness_score = scoreReadiness(docTypes);

  const narrative_score =
    business_maturity_score +
    market_score +
    founder_score +
    credibility_score +
    readiness_score;
  const quality = computeQuality(hard_score, narrative_score);

  const { confidence_score } = computeConfidence(listing, docTypes);
  const risk_score = computeRisk(
    listing,
    profile,
    docTypes,
    updateCount,
    confidence_score,
  );

  // 1. Calculate base score WITHOUT momentum
  // NEW
  let raw = quality * (0.5 + 0.5 * (confidence_score / 100)) - 0.3 * risk_score;

  if (hard_score < 35) {
    raw *= hard_score / 35;
  }

  const provisionalTotal = cap(Math.round(raw), 100);

  // 2. Calculate momentum
  const momentum_score = computeMomentum(
    listing,
    updateCount,
    prevScore,
    traction_score,
    financial_score,
    provisionalTotal,
  );

  // 3. Add momentum
  raw += momentum_score;

  const total_score = cap(Math.round(raw), 100);

  const { grade, label, color } = getGrade(total_score);

  // Confidence label
  const confidence_label =
    confidence_score >= 80 ? "High" : confidence_score >= 50 ? "Medium" : "Low";

  // Drivers & risks for explainability
  const { top_drivers, top_risks, verdict } = buildExplainability(
    listing,
    {
      traction_score,
      financial_score,
      hard_score,
      narrative_score,
      risk_score,
      confidence_score,
    },
    docTypes,
  );

  return {
    // V4 outputs
    quality,
    confidence_score,
    confidence_label,
    risk_score,
    momentum_score,
    // Internal breakdown
    traction_score,
    financial_score,
    hard_score,
    business_maturity_score,
    market_score,
    founder_score,
    credibility_score,
    readiness_score,
    narrative_score,
    total_score,
    grade,
    category: label,
    category_color: color,
    category_description: getCategoryDesc(label),
    // Explainability
    verdict,
    top_drivers,
    top_risks,
    // Momentum tracking
    previous_total: prevScore?.total_score || 0,
    previous_traction: prevScore?.traction_score || 0,
    previous_financial: prevScore?.financial_score || 0,
  };
}

function buildExplainability(listing, scores, docTypes) {
  const drivers = [];
  const risks = [];
  const narrative = analyzeNarrative(
    `
  ${listing.summary || ""}
  ${listing.use_of_funds || ""}
  `,
    listing,
  );
  narrative.insights.forEach((i) => {
    if (i.includes("Strong") || i.includes("Clear")) {
      drivers.push(i);
    } else {
      risks.push(i);
    }
  });
  if (listing.has_purchase_orders) {
    drivers.push(
      `${listing.po_count || "Confirmed"} purchase orders${listing.po_value ? ` (${fmt(listing.po_value)})` : ""}`,
    );
  }
  if ((listing.revenue_last_year || 0) > 0)
    drivers.push(`Revenue: ${fmt(listing.revenue_last_year)}`);
  if (docTypes.includes("GOVERNMENT_CONTRACT"))
    drivers.push("Government contract uploaded");
  if (listing.accelerator_name)
    drivers.push(`Accelerator: ${listing.accelerator_name}`);
  if (scores.traction_score >= 20) drivers.push("Strong traction signals");
  if (scores.confidence_score >= 75) drivers.push("High data confidence");

  const rev = listing.revenue_last_year || 0;
  const burn = listing.monthly_burn || 0;
  const ask = listing.funding_ask || 0;
  if (rev === 0 && !listing.has_purchase_orders)
    risks.push("No revenue and no purchase orders");
  if (burn > 0 && ask > 0 && ask / burn < 6)
    risks.push("Runway less than 6 months");
  if ((listing.valuation_expectation || 0) > rev * 20 && rev > 0)
    risks.push("Valuation >20x revenue");
  if (scores.confidence_score < 50)
    risks.push("Low data confidence — key fields missing");

  // Verdict (3 templates rotated by listing id hash)
  const hash = listing.id ? listing.id.charCodeAt(0) % 3 : 0;
  const strength = listing.has_purchase_orders
    ? "Order-confirmed"
    : rev > 0
      ? "Revenue-backed"
      : listing.has_government_contract
        ? "Government-validated"
        : "Early-stage";
  const risk = risks[0] || null;
  const templates = [
    `${strength} ${listing.sector || "tech"} ${listing.entity_type === "SME" ? "SME" : "startup"}${risk ? ` with ${risk.toLowerCase()}` : ""}`,
    `${listing.sector || "Tech"} ${listing.entity_type === "SME" ? "SME" : "startup"} at ${(listing.stage || "early").replace(/_/g, " ")} stage — ${strength.toLowerCase()}${risk ? `. Watch: ${risk.toLowerCase()}` : ""}`,
    `${strength} ${listing.entity_type === "SME" ? "SME" : "startup"} in ${listing.sector || "tech"}${risk ? `. Key risk: ${risk.toLowerCase()}` : " with solid fundamentals"}`,
  ];

  return {
    top_drivers: drivers.slice(0, 3),
    top_risks: risks.slice(0, 3),
    verdict: templates[hash],
  };
}

function getCategoryDesc(label) {
  const map = {
    "Deal Ready": "Exceptional fundamentals. Highly attractive to investors.",
    "Investor Ready":
      "Solid listing with strong appeal. Address minor gaps to close faster.",
    "Strong Potential":
      "Good potential. Strengthen traction and documentation.",
    Developing: "Core elements present. Add POs, revenue, and documents.",
    "Early Stage":
      "Complete your profile, add financial data and credibility signals.",
    "Needs Work": "Focus on traction and financial transparency.",
  };
  return map[label] || "";
}

export function generateReport(
  listing,
  profile,
  docCount,
  interestCount,
  updateCount,
  scores,
  docTypes = [],
) {
  const sections = [
    {
      icon: "🏢",
      title: "Business Overview",
      content: listing.summary || "No summary provided.",
    },
    {
      icon: "📦",
      title: "Traction & Purchase Orders",
      content: (() => {
        const p = [];
        if (listing.has_purchase_orders) {
          p.push("Confirmed purchase orders.");
          if (listing.po_value) p.push(`PO value: ${fmt(listing.po_value)}.`);
          if (listing.po_count) p.push(`${listing.po_count} orders.`);
        }
        if ((listing.revenue_last_year || 0) > 0)
          p.push(`Revenue: ${fmt(listing.revenue_last_year)}.`);
        if (interestCount > 0)
          p.push(`${interestCount} investors expressed interest.`);
        return p.length
          ? p.join(" ")
          : "No traction data. Add POs and revenue to significantly improve score.";
      })(),
    },
    {
      icon: "💰",
      title: "Financial Position",
      content: (() => {
        const p = [];
        if (listing.funding_ask) p.push(`Seeking ${fmt(listing.funding_ask)}.`);
        if (listing.valuation_expectation)
          p.push(`Valuation: ${fmt(listing.valuation_expectation)}.`);
        if (listing.monthly_burn)
          p.push(`Monthly burn: ${fmt(listing.monthly_burn)}.`);
        if (listing.funding_ask && listing.monthly_burn)
          p.push(
            `Implied runway: ${(listing.funding_ask / listing.monthly_burn).toFixed(0)} months.`,
          );
        if (listing.use_of_funds) p.push(listing.use_of_funds);
        return p.length ? p.join(" ") : "Financial details not provided.";
      })(),
    },
    {
      icon: "🌍",
      title: "Market & Stage",
      content: `${listing.name} operates in ${listing.sector} at ${(listing.stage || "").replace(/_/g, " ")} stage as a ${listing.entity_type}. ${HIGH_GROWTH_SECTORS.includes(listing.sector) ? `${listing.sector} is a high-growth sector with strong investor appetite.` : ""}`,
    },
    {
      icon: "👥",
      title: "Founder & Team",
      content: (() => {
        const p = [];
        if (profile?.organisation_name)
          p.push(`Organisation: ${profile.organisation_name}.`);
        if (profile?.experience_summary) p.push(profile.experience_summary);
        if (profile?.city) p.push(`Based in ${profile.city}.`);
        return p.length ? p.join(" ") : "Team profile not completed.";
      })(),
    },
    {
      icon: "🏅",
      title: "Credibility",
      content: (() => {
        const p = [];

        const hasGovContractDoc = docTypes.includes("GOVERNMENT_CONTRACT");

        if (hasGovContractDoc) {
          p.push("Government contract (document uploaded).");
        } else if (listing.has_government_contract) {
          p.push("Government contract declared by founder.");
        }

        if (listing.has_ip)
          p.push(
            `IP filed${listing.patent_number ? ` (${listing.patent_number})` : ""}.`,
          );

        if (listing.accelerator_name)
          p.push(`Accelerator: ${listing.accelerator_name}.`);
        if (listing.has_purchase_orders) p.push("Purchase orders available.");

        if (docTypes.includes("FINANCIAL_MODEL"))
          p.push("Financial model uploaded.");

        if ((listing.revenue_last_year || 0) > 0)
          p.push(`Revenue generated: ${fmt(listing.revenue_last_year)}.`);

        return p.length ? p.join(" ") : "No formal credibility signals.";
      })(),
    },
    {
      icon: "⭐",
      title: "Readiness Summary",
      content: `Score: ${scores.total_score}/100 (${scores.grade}). Quality: ${scores.quality}. Confidence: ${scores.confidence_label} (${scores.confidence_score}%). Risk: ${scores.risk_score}. Momentum: ${scores.momentum_score}/10. ${scores.category_description}`,
    },
  ];
  return {
    metadata: {
      listing_name: listing.name,
      sector: listing.sector,
      stage: listing.stage,
      entity_type: listing.entity_type,
      generated_at: new Date().toISOString(),
    },
    score: scores,
    sections,
  };
}
