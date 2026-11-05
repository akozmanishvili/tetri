import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const toastsRouter = Router();
toastsRouter.use(requireAuth);

const conceptKey = z.string().regex(/^[a-z0-9_]{1,50}$/);

// POST /api/toasts/:key/unlock
// returns toast if this the first time this user meets the concept otherwise null.
toastsRouter.post("/:key/unlock", async (req, res) => {
  const key = conceptKey.parse(req.params.key);

  const toast = await prisma.toast.findUnique({ where: { conceptKey: key } });
  if (!toast) {
    res.status(404).json({ error: "Unknown concept" }); // catches typos in the frontend
    return;
  }
  if (!toast.isActive) {
    res.json({ toast: null });
    return;
  }

  const { count } = await prisma.userToast.createMany({
    data: [{ userId: req.userId!, toastId: toast.id }],
    skipDuplicates: true,
  });

  res.json({ toast: count === 1 ? toast : null });
});

// GET /api/toasts/unlocked: everything this user has heard
toastsRouter.get("/unlocked", async (req, res) => {
  const [unlocked, total] = await Promise.all([
    prisma.userToast.findMany({
      where: { userId: req.userId!, toast: { isActive: true } },
      include: { toast: true },
      orderBy: { unlockedAt: "desc" },
    }),
    prisma.toast.count({ where: { isActive: true } }),
  ]);

  res.json({
    total,
    toasts: unlocked.map((u) => ({ ...u.toast, unlockedAt: u.unlockedAt })),
  });
});
