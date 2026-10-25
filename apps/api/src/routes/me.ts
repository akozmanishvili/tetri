import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { publicUser } from "../lib/publicUser.js";

export const meRouter = Router();

// GET /api/me: the logged-in user plus their cash balance
meRouter.get("/", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId! },
    include: { wallet: true },
  });

  res.json({
    ...publicUser(user),
    balanceTetri: user.wallet?.balanceTetri.toString() ?? "0",
  });
});
