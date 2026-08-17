/**
 * Founder Improvement Engine
 * Generates prioritised action list to improve score
 * Sorted by impact descending
 */
const IMPACT = {
  VERY_HIGH: "⭐⭐⭐⭐⭐ Very High Impact",
  HIGH: "⭐⭐⭐⭐ High Impact",
  MODERATE: "⭐⭐⭐ Moderate Impact",
  LOW: "⭐⭐ Improvement Opportunity",
};
export function getImprovements(listing, profile, docTypes, scores) {
  const suggestions = [];
  const rev = listing.revenue_last_year || 0;
  const burn = listing.monthly_burn || 0;
  const ask = listing.funding_ask || 0;

  // Traction improvements
  if (!listing.has_purchase_orders) {
    suggestions.push({
      dimension: "business_maturity_score",
      action: "Add confirmed purchase orders",
      impact: IMPACT.VERY_HIGH,
      priority: 1,
      field: "has_purchase_orders",
    });
  } else if (!listing.po_value) {
    suggestions.push({
      dimension: "business_maturity_score",
      action: "Add total PO value",
      impact: IMPACT.HIGH,
      priority: 2,
      field: "po_value",
    });
  }
  if (rev === 0) {
    suggestions.push({
      dimension: "business_maturity_score",
      action: "Add annual revenue figure",
      impact: IMPACT.VERY_HIGH,
      priority: 1,
      field: "revenue_last_year",
    });
  }

  // Financial improvements
  if (burn === 0) {
    suggestions.push({
      dimension: "readiness_score",
      action: "Add monthly burn rate",
      impact: IMPACT.HIGH,
      priority: 2,
      field: "monthly_burn",
    });
  }
  if (!listing.valuation_expectation) {
    suggestions.push({
      dimension: "readiness_score",
      action: "Add valuation expectation",
      impact: IMPACT.MODERATE,
      priority: 3,
      field: "valuation_expectation",
    });
  }
  if (ask === 0) {
    suggestions.push({
      dimension: "readiness_score",
      action: "Define your funding ask",
      impact: IMPACT.MODERATE,
      priority: 2,
      field: "funding_ask",
    });
  }

  // Document improvements
  if (!docTypes.includes("PITCH_DECK")) {
    suggestions.push({
      dimension: "readiness_score",
      action: "Upload a pitch deck",
      impact: IMPACT.HIGH,
      priority: 1,
      field: "documents",
    });
  }
  if (!docTypes.includes("FINANCIAL_MODEL")) {
    suggestions.push({
      dimension: "readiness_score",
      action: "Upload financial model",
      impact: IMPACT.HIGH,
      priority: 2,
      field: "documents",
    });
  }
  if (!docTypes.includes("BUSINESS_PLAN")) {
    suggestions.push({
      dimension: "readiness_score",
      action: "Upload business plan",
      impact: IMPACT.LOW,
      priority: 3,
      field: "documents",
    });
  }
  if (rev > 0 && !docTypes.includes("REVENUE_PROOF")) {
    suggestions.push({
      dimension: "credibility_score",
      action: "Upload revenue proof documents",
      impact: IMPACT.HIGH,
      priority: 1,
      field: "documents",
    });
  }

  if (!docTypes.includes("CUSTOMER_CONTRACT")) {
    suggestions.push({
      dimension: "credibility_score",
      action: "Upload customer contracts",
      impact: IMPACT.HIGH,
      priority: 2,
      field: "documents",
    });
  }

  if (!docTypes.includes("PATENT_CERTIFICATE") && listing.has_ip) {
    suggestions.push({
      dimension: "credibility_score",
      action: "Upload patent certificate",
      impact: IMPACT.MODERATE,
      priority: 2,
      field: "documents",
    });
  }

  if (
    !docTypes.includes("ACCELERATOR_CERTIFICATE") &&
    listing.accelerator_name
  ) {
    suggestions.push({
      dimension: "credibility_score",
      action: "Upload accelerator certificate",
      impact: IMPACT.MODERATE,
      priority: 2,
      field: "documents",
    });
  }

  if (
    listing.has_government_contract &&
    !docTypes.includes("GOVERNMENT_CONTRACT")
  ) {
    suggestions.push({
      dimension: "credibility_score",
      action: "Upload government contract proof",
      impact: IMPACT.HIGH,
      priority: 1,
      field: "documents",
    });
  }
  // Credibility improvements

  if (!listing.has_ip) {
    suggestions.push({
      dimension: "credibility_score",
      action: "Add IP/patent information",
      impact: IMPACT.MODERATE,
      priority: 3,
      field: "has_ip",
    });
  } else if (!listing.patent_number) {
    suggestions.push({
      dimension: "credibility_score",
      action: "Add patent number/reference",
      impact: IMPACT.MODERATE,
      priority: 2,
      field: "patent_number",
    });
  }
  if (!listing.accelerator_name) {
    suggestions.push({
      dimension: "credibility_score",
      action: "Add accelerator/incubator membership",
      impact: IMPACT.MODERATE,
      priority: 3,
      field: "accelerator_name",
    });
  }

  // Founder improvements
  if (!profile?.linkedin_url) {
    suggestions.push({
      dimension: "founder_score",
      action: "Add LinkedIn URL to your profile",
      impact: IMPACT.LOW,
      priority: 3,
      field: "linkedin_url",
    });
  }
  if ((profile?.experience_summary || "").length < 100) {
    suggestions.push({
      dimension: "founder_score",
      action: "Write a detailed experience summary (100+ chars)",
      impact: IMPACT.LOW,
      priority: 3,
      field: "experience_summary",
    });
  }

  // Market improvements
  if ((listing.use_of_funds || "").length < 100) {
    suggestions.push({
      dimension: "market_score",
      action: "Expand your use of funds section (100+ chars)",
      impact: IMPACT.MODERATE,
      priority: 2,
      field: "use_of_funds",
    });
  }
  if ((listing.summary || "").length < 200) {
    suggestions.push({
      dimension: "market_score",
      action: "Write a more detailed summary (200+ chars)",
      impact: IMPACT.MODERATE,
      priority: 3,
      field: "summary",
    });
  }

  // Sort by priority then by impact
  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 8);
}
