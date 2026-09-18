import { Router } from "express";
import { protect } from "../middleware/auth.js";

import {
  getPortfolio,
  getPortfolioSummary,
  getInvestment,
  getPortfolioWorkspace,
  getPortfolioMessages,
  sendPortfolioMessage,
  getPortfolioDocuments,
  addPortfolioDocument,
  deletePortfolioDocument,
  createPortfolioInvestment,
  getPortfolioMilestones,
  createPortfolioMilestone,
  updatePortfolioMilestone,
  deletePortfolioMilestone,
  createExternalInvestment,
  updateInvestment,
  deleteInvestment,
} from "../controllers/portfolio.js";

const r = Router();

// Portfolio summary
r.get("/summary", protect, getPortfolioSummary);

// Get all portfolio investments
r.get("/", protect, getPortfolio);

// Get the complete post-investment workspace
r.get("/:id/workspace", protect, getPortfolioWorkspace);

// Portfolio chat
r.get("/:id/messages", protect, getPortfolioMessages);
r.post("/:id/messages", protect, sendPortfolioMessage);
// Portfolio documents
r.get("/:id/documents", protect, getPortfolioDocuments);
r.post("/:id/documents", protect, addPortfolioDocument);
r.delete("/:id/documents/:documentId", protect, deletePortfolioDocument);

// Portfolio milestones
r.get("/:id/milestones", protect, getPortfolioMilestones);
r.post("/:id/milestones", protect, createPortfolioMilestone);
r.put("/:id/milestones/:milestoneId", protect, updatePortfolioMilestone);
r.delete("/:id/milestones/:milestoneId", protect, deletePortfolioMilestone);

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

