import { Router } from "express";
import { z } from "zod";
import { Decimal } from "decimal.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { simulate } from "../services/simluator.js";

export const simulatorRouter = Router();
simulatorRouter.use(requireAuth);

const percent = z
  .string()
  .regex(/^\d{1,2}(\.\d{1,2})?$/, "Use a percentage like 3 or 10.5")
  .transform((s) => new Decimal(s));

const schema = z.object({
  amountTetri: z
    .string()
    .regex(/^\d+$/, "Amount must be a whole number of tetri")
    .transform((s) => BigInt(s))
    .refine(
      (v) => v >= 100n && v <= 100_000_000n,
      "Between 1 and 1,000,000 GEL",
    ),
  mode: z.enum(["monthly", "lump"]),
  start: z.iso.date().transform((s) => new Date(`${s}T00:00:00Z`)),
  symbols: z
    .array(z.string().trim().toUpperCase())
    .min(1, "Pick at least one instrument")
    .max(8)
    .refine((a) => new Set(a).size === a.length, "No duplicates"),
  depositRatePct: percent,
  inflationPct: percent,
});

simulatorRouter.post("/", async (req, res) => {
  res.json(await simulate(schema.parse(req.body)));
});
