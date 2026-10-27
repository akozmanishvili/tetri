import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getPortfolio } from "../services/portfolio.js";

export const portfolioRouter = Router();

// GET /api/portfolio
portfolioRouter.get("/", requireAuth, async (req, res) => {
  res.json(await getPortfolio(req.userId!));
});
