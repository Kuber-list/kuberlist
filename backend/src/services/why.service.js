/**
 * Why This Deal
 * Generates personalised reasons why this listing is relevant to this investor
 */

export function generateWhy(listing, scores, matchScore, activityProfile, investorProfile, isSaved) {
  const reasons = [];

  // Activity-based reasons
  const actScore = activityProfile?.[listing.sector] || 0;
  if (actScore > 0) reasons.push(`Matches your ${listing.sector} investment activity`);

  // Preference-based reasons
  if ((investorProfile?.preferred_sectors||[]).includes(listing.sector)) {
    reasons.push(`In your preferred sector: ${listing.sector}`);
  }
  if ((investorProfile?.preferred_stage||[]).includes(listing.stage)) {
    reasons.push(`Matches your preferred stage: ${listing.stage?.replace(/_/g,' ')}`);
  }
  const ask = listing.funding_ask || 0;
  const min = investorProfile?.ticket_min || 0;
  const max = investorProfile?.ticket_max || Infinity;
  if (ask >= min && ask <= max) reasons.push('Funding ask within your ticket range');

  // Traction reasons
  if (listing.has_purchase_orders) {
    reasons.push(listing.po_value
      ? `Confirmed POs worth ₹${listing.po_value >= 10000000 ? (listing.po_value/10000000).toFixed(1)+'Cr' : (listing.po_value/100000).toFixed(1)+'L'}`
      : 'Confirmed purchase orders in place');
  }
  if ((listing.revenue_last_year||0) > 0) reasons.push('Revenue-generating business');

  // Credibility reasons
  if (listing.has_government_contract) reasons.push('Government contract confirmed');
  if (listing.accelerator_name) reasons.push(`Backed by ${listing.accelerator_name}`);
  if (listing.has_ip && listing.patent_number) reasons.push('Verified IP / patent filed');

  // Score reasons
  if (scores.total_score >= 75) reasons.push('High readiness score — deal ready');
  if (scores.confidence_label === 'High') reasons.push('High data confidence — verified claims');
  if (scores.momentum_score >= 7) reasons.push('High momentum — rapidly improving listing');

  // Engagement
  if (isSaved) reasons.push('You saved this listing earlier');

  // Return top 3 most relevant
  return reasons.slice(0, 3);
}
