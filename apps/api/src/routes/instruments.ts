import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const instrumentsRouter = Router();

// all active funds and stocks
instrumentsRouter.get("/", async (_req, res) => {
  const instruments = await prisma.instrument.findMany({
    where: { isActive: true },
    orderBy: [{ type: "asc" }, { symbol: "asc" }],
  });
  res.json(instruments);
});

// price history for charts
instrumentsRouter.get("/:symbol/prices", async (req, res) => {
  const instrument = await prisma.instrument.findUnique({
    where: { symbol: req.params.symbol.toUpperCase() },
    include: { prices: { orderBy: { date: "asc" } } },
  });

  if (!instrument) {
    res.status(404).json({ error: "Instrument not found" });
    return;
  }

  res.json({
    symbol: instrument.symbol,
    currency: instrument.currency,
    prices: instrument.prices.map((p) => ({
      date: p.date.toISOString().slice(0, 10),
      value: p.value.toString(),
    })),
  });
});
