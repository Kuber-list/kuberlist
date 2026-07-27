/**
 * Narrative Interpretation Engine
 *
 * Purpose:
 * Replace primitive length-based heuristics
 * with institutional narrative interpretation.
 *
 * This engine DOES NOT score:
 * - revenue
 * - valuation
 * - runway
 * - customers
 *
 * Those belong to structured scoring.
 *
 * This engine ONLY evaluates:
 * - clarity
 * - specificity
 * - coherence
 * - fluff
 * - institutional communication quality
 * - operational realism
 * - contradiction signals
 */

const cap = (v, max) => Math.min(Math.max(v, 0), max);

const FLUFF_WORDS = [
  'revolutionary',
  'disruptive',
  'game changing',
  'world class',
  'next generation',
  'cutting edge',
  'innovative solution',
  'best in class',
  'industry leading',
  'scalable platform',
  'transforming the future',
  'unicorn',
  'dominant player',
  'market leader'
];

const STRONG_BUSINESS_TERMS = [
  'pilot',
  'deployment',
  'contract',
  'purchase order',
  'customers',
  'subscription',
  'retention',
  'margin',
  'integration',
  'workflow',
  'compliance',
  'distribution',
  'supply chain',
  'manufacturing',
  'saas',
  'b2b',
  'api',
  'automation',
  'enterprise',
  'recurring revenue'
];

const NEGATIVE_PATTERNS = [
  'guaranteed returns',
  '100% success',
  'no competition',
  'instant growth',
  'zero risk'
];

/**
 * Detect fluff density
 */
function detectFluff(text) {
  let fluffScore = 0;

  FLUFF_WORDS.forEach(word => {
    if (text.includes(word)) {
      fluffScore += 3;
    }
  });

  return fluffScore;
}
/**
 * Detect institutional specificity
 */
function detectSpecificity(text) {
  let score = 0;

  // Numbers indicate operational specificity
  const numbers = text.match(/\d+/g);

  if (numbers?.length) {
    score += Math.min(numbers.length * 1.5, 5);
  }

  // Strong operational/business terms
  STRONG_BUSINESS_TERMS.forEach(term => {
    if (text.includes(term)) {
      score += 1.5;
    }
  });

  return cap(score, 10);
}

/**
 * Detect communication clarity
 */
function detectClarity(text) {
  let score = 0;

  const words = text.split(/\s+/).length;
  const avgSentenceLength =
    text.split('.')
      .map(s => s.trim().split(/\s+/).length)
      .reduce((a, b) => a + b, 0) /
    Math.max(text.split('.').length, 1);

  // Minimum useful detail
  if (words >= 40) score += 3;

  // Penalize extremely long unreadable sentences
  if (avgSentenceLength <= 25) {
    score += 4;
  } else {
    score -= 2;
  }

  // Penalize excessive caps
  const capsMatches = text.match(/[A-Z]{5,}/g);
  if (!capsMatches) {
    score += 2;
  }

  return cap(score, 10);
}

/**
 * Detect operational realism
 */
function detectOperationalRealism(text) {
  let score = 0;

  const realismSignals = [
    'monthly',
    'annual',
    'process',
    'team',
    'operations',
    'clients',
    'deployment',
    'implementation',
    'vendors',
    'timeline',
    'distribution'
  ];

  realismSignals.forEach(signal => {
    if (text.includes(signal)) {
      score += 1.5;
    }
  });

  return cap(score, 10);
}

/**
 * Detect narrative coherence
 */
function detectCoherence(text) {
  let score = 5;

  // Extremely short summaries lack coherence
  if (text.length < 80) {
    score -= 3;
  }

  // Excessive punctuation/spam
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 3) {
    score -= 3;
  }

  // Suspicious hype patterns
  NEGATIVE_PATTERNS.forEach(pattern => {
    if (text.includes(pattern)) {
      score -= 3;
    }
  });

  return cap(score, 10);
}

/**
 * Detect contradiction risk
 *
 * NOTE:
 * This should later compare
 * against structured listing data.
 */
function detectNarrativeRisk(text) {
  let risk = 0;

  NEGATIVE_PATTERNS.forEach(pattern => {
    if (text.includes(pattern)) {
      risk += 4;
    }
  });

  return cap(risk, 10);
}
function detectContradictions(text, listing = {}) {

  const contradictions = [];

  const rev = listing.revenue_last_year || 0;

  // Profitability contradiction
  if (
    rev === 0 &&
    (
      text.includes('profitable') ||
      text.includes('profitability')
    )
  ) {
    contradictions.push('Claims profitability despite zero revenue');
  }

  // Scale contradiction
  if (
    !listing.has_purchase_orders &&
    (
      text.includes('enterprise scale') ||
      text.includes('large scale deployment')
    )
  ) {
    contradictions.push('Large-scale claims without operational proof');
  }

  // Market leadership contradiction
  if (
    rev < 100000 &&
    (
      text.includes('market leader') ||
      text.includes('industry leader')
    )
  ) {
    contradictions.push('Leadership claims unsupported by traction');
  }

  return contradictions;
}

/**
 * Main Narrative Analysis
 */
export function analyzeNarrative(summary = '', listing = {}) {

  const text = summary.toLowerCase().trim();

  if (!text || text.length < 30) {
    return {
      narrative_score: 0,
      narrative_risk: 5,

      breakdown: {
        clarity: 0,
        specificity: 0,
        coherence: 0,
        operational_realism: 0,
        fluff_penalty: 0
      },

      contradictions: [],

      insights: ['Summary too short']
    };
  }

  const clarity = detectClarity(text);

  const specificity = detectSpecificity(text);

  const coherence = detectCoherence(text);

  const operationalRealism = detectOperationalRealism(text);

  const fluffPenalty = detectFluff(text);

  const narrativeRisk = detectNarrativeRisk(text);

  const contradictions = detectContradictions(text, listing);

  let narrativeScore =
    clarity +
    specificity +
    coherence +
    operationalRealism -
    fluffPenalty;

  // contradiction penalties
  narrativeScore -= contradictions.length * 3;

  narrativeScore = cap(Math.round(narrativeScore), 40);

  const insights = [];

  if (specificity >= 7) {
    insights.push('Strong operational specificity');
  }

  if (clarity >= 7) {
    insights.push('Clear institutional communication');
  }

  if (operationalRealism >= 6) {
    insights.push('Operationally realistic narrative');
  }

  if (fluffPenalty >= 6) {
    insights.push('Excessive buzzword density');
  }

  if (narrativeRisk >= 5) {
    insights.push('Contains high-risk narrative claims');
  }

  contradictions.forEach(c => {
    insights.push(c);
  });

  return {
    narrative_score: narrativeScore,

    narrative_risk: narrativeRisk +

      contradictions.length * 2,

    breakdown: {
      clarity,
      specificity,
      coherence,
      operational_realism: operationalRealism,
      fluff_penalty: fluffPenalty
    },

    contradictions,

    insights
  };
}