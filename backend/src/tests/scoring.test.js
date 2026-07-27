import { scoreListing } from '../services/scoring.js';

describe('Scoring Engine', () => {

  const baseListing = {
    id: "1",
    name: "Test Startup",
    sector: "FinTech",
    stage: "seed",
    entity_type: "STARTUP",
    revenue_last_year: 500000,
    monthly_burn: 20000,
    funding_ask: 300000,
    valuation_expectation: 2000000,
    summary: "Strong fintech startup",
    created_at: new Date(),
    updated_at: new Date()
  };

  test('should return a valid score', () => {
    const result = scoreListing(baseListing, {}, ['PITCH_DECK'], 2, null);

    expect(result.total_score).toBeGreaterThanOrEqual(0);
    expect(result.total_score).toBeLessThanOrEqual(100);
    expect(result).toHaveProperty('grade');
  });

  test('confidence should increase score', () => {
    const low = scoreListing(baseListing, {}, [], 0, null);
    const high = scoreListing(baseListing, {}, ['PITCH_DECK'], 3, null);

    expect(high.total_score).toBeGreaterThan(low.total_score);
  });

  test('risk should reduce score', () => {
    const risky = {
      ...baseListing,
      revenue_last_year: 0,
      monthly_burn: 100000
    };

    const result = scoreListing(risky, {}, [], 0, null);

    expect(result.risk_score).toBeGreaterThan(0);
  });

  test('momentum should increase score when improving', () => {
    const prev = { total_score: 40, traction_score: 5, financial_score: 5 };

    const result = scoreListing(baseListing, {}, ['PITCH_DECK'], 5, prev);

    expect(result.momentum_score).toBeGreaterThan(0);
  });

});