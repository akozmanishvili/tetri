import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { publicUser } from "../lib/publicUser.js";
import { z } from "zod";

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

const updateMeSchema = z
  .object({
    locale: z.enum(["ka", "en"]).optional(),
    humorEnabled: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, "Nothing to update");

// PATCH /api/me: update the user's own preferences
meRouter.patch("/", requireAuth, async (req, res) => {
  const data = updateMeSchema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.userId! }, data });
  res.json(publicUser(user));
});
