import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { Decimal } from "decimal.js";
import { fxRate, latestPrice } from "../services/trading.js";
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

// GET /api/instruments/:symbol/quote: latest price, FX rate and price per unit in GEL
instrumentsRouter.get("/:symbol/quote", async (req, res) => {
  const instrument = await prisma.instrument.findUnique({
    where: { symbol: req.params.symbol.toUpperCase() },
  });
  if (!instrument) {
    res.status(404).json({ error: "Instrument not found" });
    return;
  }

  const now = new Date();
  const price = await latestPrice(prisma, instrument.id, now);
  if (!price) {
    res.status(503).json({ error: "No price available" });
    return;
  }
  const fx = await fxRate(prisma, instrument.currency, now);

  res.json({
    ...instrument,
    price: price.value.toString(),
    priceDate: price.date.toISOString().slice(0, 10),
    fxRate: fx.toString(),
    gelPerUnit: new Decimal(price.value.toString()).mul(fx).toString(),
  });
});
