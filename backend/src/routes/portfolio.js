import { Router } from "express";
import { protect } from "../middleware/auth.js";

import {
  getPortfolio,
  getPortfolioSummary,
  getInvestment,
  createPortfolioInvestment,
  createExternalInvestment,
  updateInvestment,
  deleteInvestment,
} from "../controllers/portfolio.js";

const r = Router();

// Portfolio summary
r.get("/summary", protect, getPortfolioSummary);

// Get all portfolio investments
r.get("/", protect, getPortfolio);

// Get a single investment
r.get("/:id", protect, getInvestment);

// Add an existing KuberList startup to portfolio
r.post("/", protect, createPortfolioInvestment);

// Add an external organization and investment
r.post("/external", protect, createExternalInvestment);

// Update an investment
r.put("/:id", protect, updateInvestment);

// Delete an investment
r.delete("/:id", protect, deleteInvestment);

export default r;
