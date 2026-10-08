import { scoreListing } from "../services/scoring.js";

describe("Scoring Engine", () => {
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
    updated_at: new Date(),
  };

  test("should return a valid score", () => {
    const result = scoreListing(baseListing, {}, ["PITCH_DECK"], 2, null);

    expect(result.total_score).toBeGreaterThanOrEqual(0);
    expect(result.total_score).toBeLessThanOrEqual(100);
    expect(result).toHaveProperty("grade");
  });

  test("confidence should increase score", () => {
    const low = scoreListing(baseListing, {}, [], 0, null);
    const high = scoreListing(baseListing, {}, ["PITCH_DECK"], 3, null);

    expect(high.total_score).toBeGreaterThan(low.total_score);
  });

  test("risk should reduce score", () => {
    const risky = {
      ...baseListing,
      revenue_last_year: 0,
      monthly_burn: 100000,
    };

    const result = scoreListing(risky, {}, [], 0, null);

    expect(result.risk_score).toBeGreaterThan(0);
  });

  test("momentum should increase score when improving", () => {
    const prev = { total_score: 40, traction_score: 5, financial_score: 5 };

    const result = scoreListing(baseListing, {}, ["PITCH_DECK"], 5, prev);

    expect(result.momentum_score).toBeGreaterThan(0);
  });
  test("V4 traction should reward revenue and revenue growth", () => {
    const listing = {
      ...baseListing,
      revenue_last_year: 10000000,
      revenue_previous_year: 5000000,
      customers_current: 100,
      customers_previous: 50,
    };

    const result = scoreListing(listing, {}, [], 0, null);

    expect(result.traction_score).toBeGreaterThan(0);
    expect(result.traction_score).toBeLessThanOrEqual(30);
  });

  test("V4 traction should reward customer growth", () => {
    const listing = {
      ...baseListing,
      revenue_last_year: 500000,
      revenue_previous_year: 400000,
      customers_current: 1000,
      customers_previous: 500,
    };

    const result = scoreListing(listing, {}, [], 0, null);

    expect(result.traction_score).toBeGreaterThan(0);
  });

  test("V4 traction should reward commercial evidence", () => {
    const listing = {
      ...baseListing,
      revenue_last_year: 500000,
      has_purchase_orders: true,
      po_value: 5000000,
      po_count: 3,
      commercial_evidence: [
        {
          evidence_type: "SIGNED_CONTRACT",
          count: 2,
          total_value: 5000000,
        },
      ],
    };

    const result = scoreListing(listing, {}, [], 0, null);

    expect(result.traction_score).toBeGreaterThan(0);
  });

  test("V4 traction should reward repeatability", () => {
    const listing = {
      ...baseListing,
      revenue_last_year: 5000000,
      customers_current: 100,
      repeat_customers: 50,
      repeat_orders: 75,
      recurring_revenue_percent: 70,
    };

    const result = scoreListing(listing, {}, [], 0, null);

    expect(result.traction_score).toBeGreaterThan(0);
  });

  test("V4 traction should be capped at 30", () => {
    const listing = {
      ...baseListing,
      revenue_last_year: 100000000,
      revenue_previous_year: 1000000,
      customers_current: 10000,
      customers_previous: 100,
      repeat_customers: 10000,
      repeat_orders: 10000,
      recurring_revenue_percent: 100,
      has_purchase_orders: true,
      po_value: 100000000,
      po_count: 100,
      commercial_evidence: [
        {
          evidence_type: "SIGNED_CONTRACT",
          count: 100,
          total_value: 100000000,
        },
      ],
    };

    const result = scoreListing(listing, {}, [], 0, null);

    expect(result.traction_score).toBeLessThanOrEqual(30);
  });

  test("V4 traction should not depend on updateCount", () => {
    const listing = {
      ...baseListing,
      revenue_last_year: 5000000,
      revenue_previous_year: 2500000,
      customers_current: 100,
      customers_previous: 50,
    };

    const withoutUpdates = scoreListing(listing, {}, [], 0, null);
    const withUpdates = scoreListing(listing, {}, [], 10, null);

    expect(withoutUpdates.traction_score).toBe(withUpdates.traction_score);
  });
});
