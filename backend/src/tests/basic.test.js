import { scoreListing } from '../services/scoring.js';

test('score returns value', () => {
  const listing = {
    name: "Test",
    sector: "FinTech",
    stage: "seed",
    summary: "good startup",
    revenue_last_year: 10000,
    monthly_burn: 1000
  };

  const result = scoreListing(listing, {}, [], 0, null);

  expect(result.total_score).toBeDefined();
});