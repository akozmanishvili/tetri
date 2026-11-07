import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { isUniqueViolation } from "../lib/errors.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin); // every route below is admin-only

const fields = {
  conceptKey: z
    .string()
    .regex(/^[a-z0-9_]{1,50}$/, "Use lowercase letters, numbers and _ only"),
  emoji: z.string().min(1).max(8),
  titleKa: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().min(1).max(120),
  bodyKa: z.string().trim().min(1).max(600),
  bodyEn: z.string().trim().min(1).max(600),
  isActive: z.boolean(),
};

const createSchema = z.object({
  ...fields,
  emoji: fields.emoji.default("🍷"),
  isActive: fields.isActive.default(true),
});

const updateSchema = z.object(fields).partial();

// GET /api/admin/toasts: all toasts, with how many users have heard each
adminRouter.get("/toasts", async (_req, res) => {
  const toasts = await prisma.toast.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { unlockedBy: true } } },
  });
  res.json(toasts);
});

// POST /api/admin/toasts
adminRouter.post("/toasts", async (req, res) => {
  const data = createSchema.parse(req.body);
  try {
    res.status(201).json(await prisma.toast.create({ data }));
  } catch (e) {
    if (isUniqueViolation(e)) {
      res.status(409).json({ error: "That concept key already exists" });
      return;
    }
    throw e;
  }
});

// PATCH /api/admin/toasts/:id
adminRouter.patch("/toasts/:id", async (req, res) => {
  const data = updateSchema.parse(req.body);
  const existing = await prisma.toast.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    res.status(404).json({ error: "Toast not found" });
    return;
  }
  try {
    res.json(await prisma.toast.update({ where: { id: existing.id }, data }));
  } catch (e) {
    if (isUniqueViolation(e)) {
      res.status(409).json({ error: "That concept key already exists" });
      return;
    }
    throw e;
  }
});
