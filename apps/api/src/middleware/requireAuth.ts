import type { RequestHandler } from "express";
import { verifyAccessToken } from "../lib/tokens.js";

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing access token" });
    return;
  }

  try {
    req.userId = verifyAccessToken(header.slice("Bearer ".length));
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
};
