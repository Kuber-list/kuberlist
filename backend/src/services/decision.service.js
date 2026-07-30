/**
 * Decision Layer
 * Converts a score into an actionable investor signal
 */

export function getDecision(scores) {
  const { total_score, risk_score, confidence_score } = scores;

  if (total_score >= 75 && risk_score < 30) return "HIGH_READINESS";
  if (total_score >= 65) return "HIGH_POTENTIAL";
  if (total_score >= 50) return "DEVELOPING";
  return "EARLY_STAGE";
}

export const DECISION_META = {
  HIGH_READINESS: {
    label: "High Readiness",
    color: "#059669",
    bg: "bg-green-50",
    border: "border-green-200",
    description: "Strong fundamentals and low risk. Prioritise.",
  },
  HIGH_POTENTIAL: {
    label: "High Potential",
    color: "#022440",
    bg: "bg-blue-50",
    border: "border-blue-200",
    description: "Promising signals. Worth a deeper look.",
  },
  DEVELOPING: {
    label: "Developing",
    color: "#B45309",
    bg: "bg-amber-50",
    border: "border-amber-200",
    description: "Developing. Monitor for improvements.",
  },
  EARLY_STAGE: {
    label: "Early Stage",
    color: "#DC2626",
    bg: "bg-red-50",
    border: "border-red-200",
    description: "Early stage. Consider for future evaluation.",
  },
};
