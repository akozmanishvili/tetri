import { Router } from "express";
import { z } from "zod";
import { Decimal } from "decimal.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { placeOrder } from "../services/trading.js";

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

const symbol = z.string().trim().toUpperCase();

// money and units arrive as strings
const orderSchema = z.discriminatedUnion("side", [
  z.object({
    symbol,
    side: z.literal("BUY"),
    amountTetri: z
      .string()
      .regex(/^\d+$/, "Amount must be a whole number of tetri")
      .transform((s) => BigInt(s))
      .refine((v) => v >= 100n, "Minimum order is 1 GEL"),
  }),
  z.object({
    symbol,
    side: z.literal("SELL"),
    units: z
      .string()
      .regex(/^\d+(\.\d{1,8})?$/, "Units can have at most 8 decimal places")
      .transform((s) => new Decimal(s))
      .refine((d) => d.gt(0), "Units must be positive"),
  }),
]);

// POST /api/orders
ordersRouter.post("/", async (req, res) => {
  const body = orderSchema.parse(req.body);
  const order = await placeOrder({ userId: req.userId!, ...body });
  res.status(201).json(order);
});

// GET /api/orders
ordersRouter.get("/", async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.userId! },
    include: {
      instrument: {
        select: { symbol: true, nameEn: true, nameKa: true, currency: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(orders);
});
