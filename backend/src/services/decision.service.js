/**
 * Decision Layer
 * Converts a score into an actionable investor signal
 */

export function getDecision(scores) {
  const { total_score, risk_score, confidence_score } = scores;

  if (total_score >= 75 && risk_score < 30)  return 'STRONG_BUY';
  if (total_score >= 65)                     return 'INVESTIGATE';
  if (total_score >= 50)                     return 'WATCH';
  return                                            'PASS';
}

export const DECISION_META = {
  STRONG_BUY:  { label: 'Strong Buy',  color: '#059669', bg: 'bg-green-50',  border: 'border-green-200', description: 'Strong fundamentals and low risk. Prioritise.' },
  INVESTIGATE: { label: 'Investigate', color: '#022440', bg: 'bg-blue-50',   border: 'border-blue-200',  description: 'Promising signals. Worth a deeper look.' },
  WATCH:       { label: 'Watch',       color: '#B45309', bg: 'bg-amber-50',  border: 'border-amber-200', description: 'Developing. Monitor for improvements.' },
  PASS:        { label: 'Pass',        color: '#DC2626', bg: 'bg-red-50',    border: 'border-red-200',   description: 'Insufficient signals for investment consideration.' },
};
