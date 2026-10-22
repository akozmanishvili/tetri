/// <reference types="node" />
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

// same "random" data on every machine every run.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);

function randNormal() {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function businessDays(count: number): Date[] {
  const days: Date[] = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  while (days.length < count) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) days.unshift(new Date(d));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return days;
}

// each day, price *= e^(drift + volatility * noise)
function simulate(
  days: Date[],
  start: number,
  annualReturn: number,
  annualVol: number,
) {
  const dt = 1 / 252; // 252 trading days per year
  let price = start;
  return days.map((date, i) => {
    if (i > 0) {
      const drift = (annualReturn - annualVol ** 2 / 2) * dt;
      const shock = annualVol * Math.sqrt(dt) * randNormal();
      price *= Math.exp(drift + shock);
    }
    return { date, value: price.toFixed(6) };
  });
}

const instruments = [
  {
    symbol: "TMMF",
    nameEn: "Tetri Lari Money Market Fund",
    nameKa: "თეთრი — ლარის ბაზრის ფონდი",
    type: "MONEY_MARKET_FUND",
    currency: "GEL",
    expenseRatioBps: 50,
    sim: { start: 100, ret: 0.075, vol: 0.003 },
  },
  {
    symbol: "TBND",
    nameEn: "Tetri Georgian Bond Fund",
    nameKa: "თეთრი — ქართული ობლიგაციების ფონდი",
    type: "BOND_FUND",
    currency: "GEL",
    expenseRatioBps: 75,
    sim: { start: 100, ret: 0.09, vol: 0.05 },
  },
  {
    symbol: "TGEQ",
    nameEn: "Tetri Global Equity Index Fund",
    nameKa: "თეთრი — გლობალური აქციების ინდექსის ფონდი",
    type: "EQUITY_FUND",
    currency: "USD",
    expenseRatioBps: 40,
    sim: { start: 50, ret: 0.08, vol: 0.16 },
  },
  {
    symbol: "BGEO",
    nameEn: "Lion Finance Group",
    nameKa: "ლაიონ ფაინენს ჯგუფი",
    type: "STOCK",
    currency: "GBP",
    expenseRatioBps: null,
    sim: { start: 75, ret: 0.15, vol: 0.3 },
  },
  {
    symbol: "TBCG",
    nameEn: "TBC Bank Group",
    nameKa: "თიბისი ბანკის ჯგუფი",
    type: "STOCK",
    currency: "GBP",
    expenseRatioBps: null,
    sim: { start: 44, ret: 0.1, vol: 0.28 },
  },
  {
    symbol: "CGEO",
    nameEn: "Georgia Capital",
    nameKa: "საქართველოს კაპიტალი",
    type: "STOCK",
    currency: "GBP",
    expenseRatioBps: null,
    sim: { start: 25, ret: 0.12, vol: 0.35 },
  },
  {
    symbol: "AAPL",
    nameEn: "Apple Inc.",
    nameKa: "ეფლი",
    type: "STOCK",
    currency: "USD",
    expenseRatioBps: null,
    sim: { start: 230, ret: 0.12, vol: 0.25 },
  },
  {
    symbol: "MSFT",
    nameEn: "Microsoft",
    nameKa: "მაიკროსოფტი",
    type: "STOCK",
    currency: "USD",
    expenseRatioBps: null,
    sim: { start: 420, ret: 0.11, vol: 0.22 },
  },
] as const;

// Approximates
const fxSeeds = [
  { currency: "USD", start: 2.65, vol: 0.06 },
  { currency: "GBP", start: 3.5, vol: 0.07 },
  { currency: "EUR", start: 3.0, vol: 0.06 },
] as const;

// seeding

async function main() {
  const days = businessDays(260); // ~1 year of trading days

  for (const { sim, ...data } of instruments) {
    const instrument = await prisma.instrument.upsert({
      where: { symbol: data.symbol },
      update: data,
      create: data,
    });

    const prices = simulate(days, sim.start, sim.ret, sim.vol);
    await prisma.price.createMany({
      data: prices.map((p) => ({ instrumentId: instrument.id, ...p })),
      skipDuplicates: true,
    });
    console.log(`✓ ${data.symbol.padEnd(5)} ${prices.length} prices`);
  }

  for (const fx of fxSeeds) {
    const rates = simulate(days, fx.start, 0, fx.vol);
    await prisma.fxRate.createMany({
      data: rates.map((r) => ({
        currency: fx.currency,
        date: r.date,
        gelPerUnit: r.value,
      })),
      skipDuplicates: true,
    });
    console.log(`✓ ${fx.currency}/GEL ${rates.length} rates`);
  }

  console.log("Seeding complete. Gagvimarjos Qartvelno!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
