import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Decimal } from "decimal.js";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { annualizedReturn, simulate } from "./simluator.js";
import { startOfUtcDay } from "./trading.js";

const DAY = 86_400_000;
let days: Date[] = [];

beforeEach(async () => {
  const inst = await prisma.instrument.upsert({
    where: { symbol: "TSIM" },
    update: {},
    create: {
      symbol: "TSIM",
      nameEn: "Sim",
      nameKa: "სიმ",
      type: "STOCK",
      currency: "GEL",
    },
  });
  await prisma.price.deleteMany({ where: { instrumentId: inst.id } });

  const today = startOfUtcDay(new Date());
  days = [];
  for (
    let d = new Date(today.getTime() - 75 * DAY);
    d <= today;
    d = new Date(d.getTime() + DAY)
  ) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) days.push(d);
  }
  await prisma.price.createMany({
    data: days.map((date, i) => ({
      instrumentId: inst.id,
      date,
      value: i === days.length - 1 ? "200" : "100",
    })),
  });
});

const base = {
  amountTetri: 100_000n,
  symbols: ["TSIM"],
  depositRatePct: new Decimal(0),
  inflationPct: new Decimal(0),
};

describe("simulate", () => {
  it("lump sum: 1,000 GEL bought at 100 is exactly 2,000 GEL at 200", async () => {
    const r = await simulate({ ...base, mode: "lump", start: days[0] });
    const tsim = r.options.find((o) => o.key === "TSIM")!;

    expect(r.investedTetri).toBe("100000");
    expect(tsim.finalTetri).toBe("200000");
    expect(tsim.returnPct).toBe("100.00");
  });

  it("monthly: contributes once per calendar month; cash and a 0% deposit keep their value", async () => {
    const r = await simulate({ ...base, mode: "monthly", start: days[0] });
    const months = new Set(days.map((d) => d.toISOString().slice(0, 7))).size;

    expect(r.contributions).toBe(months);
    expect(r.investedTetri).toBe(String(100_000 * months));
    expect(r.options.find((o) => o.key === "MATTRESS")!.finalTetri).toBe(
      r.investedTetri,
    );
    expect(r.options.find((o) => o.key === "DEPOSIT")!.finalTetri).toBe(
      r.investedTetri,
    );
    expect(r.breakEvenTetri).toBe(r.investedTetri); // 0% inflation
  });

  it("a deposit with interest beats cash, and inflation makes cash lose", async () => {
    const r = await simulate({
      ...base,
      mode: "lump",
      start: days[0],
      depositRatePct: new Decimal(12),
      inflationPct: new Decimal(3),
    });
    const cash = r.options.find((o) => o.key === "MATTRESS")!;
    const deposit = r.options.find((o) => o.key === "DEPOSIT")!;

    expect(BigInt(deposit.finalTetri)).toBeGreaterThan(BigInt(cash.finalTetri));
    expect(cash.beatsInflation).toBe(false);
    expect(deposit.beatsInflation).toBe(true);
  });
});

describe("annualizedReturn (XIRR)", () => {
  it("+10% after exactly one year is 10% a year", () => {
    const t0 = new Date("2025-01-01T00:00:00Z");
    const r = annualizedReturn([
      { date: t0, amount: -1000 },
      { date: new Date(t0.getTime() + 365.25 * DAY), amount: 1100 },
    ]);
    expect(r).toBeCloseTo(0.1, 6);
  });

  it("refuses to annualize less than 90 days", () => {
    const t0 = new Date("2025-01-01T00:00:00Z");
    expect(
      annualizedReturn([
        { date: t0, amount: -1000 },
        { date: new Date(t0.getTime() + 30 * DAY), amount: 1010 },
      ]),
    ).toBeNull();
  });
});

describe("POST /api/simulator", () => {
  async function token() {
    const res = await request(app).post("/api/auth/signup").send({
      email: "sim@tetri.ge",
      password: "supersecret123",
      displayName: "Sim",
    });
    return res.body.accessToken as string;
  }

  const body = (overrides: object) => ({
    amountTetri: "100000",
    mode: "lump",
    start: days[0].toISOString().slice(0, 10),
    symbols: ["TSIM"],
    depositRatePct: "0",
    inflationPct: "0",
    ...overrides,
  });

  it("rejects a start date that's too recent", async () => {
    const res = await request(app)
      .post("/api/simulator")
      .set("Authorization", `Bearer ${await token()}`)
      .send(body({ start: new Date().toISOString().slice(0, 10) }));
    expect(res.status).toBe(400);
  });

  it("rejects unknown instruments", async () => {
    const res = await request(app)
      .post("/api/simulator")
      .set("Authorization", `Bearer ${await token()}`)
      .send(body({ symbols: ["NOPE"] }));
    expect(res.status).toBe(400);
  });
});
