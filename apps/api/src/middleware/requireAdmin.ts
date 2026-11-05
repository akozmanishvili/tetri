import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    res.status(403).json({ error: "Admins only" });
    return;
  }
  next();
};
