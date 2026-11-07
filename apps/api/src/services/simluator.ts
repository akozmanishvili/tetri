import { Decimal } from "decimal.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/errors.js";
import { startOfUtcDay } from "./trading.js";

const DAY_MS = 86_400_000;
const YEAR_DAYS = 365.25;

export type SimulationInput = {
  amountTetri: bigint; // per contribution
  mode: "monthly" | "lump";
  start: Date;
  symbols: string[];
  depositRatePct: Decimal;
  inflationPct: Decimal;
};

type Flow = { date: Date; amount: number };

// money-weighted annual return (XIRR)
export function annualizedReturn(flows: Flow[]): number | null {
  const t0 = flows[0].date.getTime();
  const spanDays = (flows[flows.length - 1].date.getTime() - t0) / DAY_MS;
  if (spanDays < 90) return null;

  const years = (d: Date) => (d.getTime() - t0) / DAY_MS / YEAR_DAYS;
  const npv = (r: number) =>
    flows.reduce(
      (sum, f) => sum + f.amount / Math.pow(1 + r, years(f.date)),
      0,
    );

  let lo = -0.99; // -99% a year
  let hi = 10; // +1000% a year
  if (npv(lo) * npv(hi) > 0) return null; // no sign change: no meaningful rate exists

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export async function simulate(input: SimulationInput) {
  const instruments = await prisma.instrument.findMany({
    where: { symbol: { in: input.symbols }, isActive: true },
  });
  if (instruments.length !== input.symbols.length) {
    throw new HttpError("Unknown instrument in the list", 400);
  }

  // start no earlier than the latest "first price" among the picks
  const end = startOfUtcDay(new Date());
  let start = startOfUtcDay(input.start);
  for (const inst of instruments) {
    const first = await prisma.price.findFirst({
      where: { instrumentId: inst.id },
      orderBy: { date: "asc" },
      select: { date: true },
    });
    if (!first) throw new HttpError(`No price history for ${inst.symbol}`, 503);
    if (first.date > start) start = first.date;
  }
  if (end.getTime() - start.getTime() < 28 * DAY_MS) {
    throw new HttpError("Pick a start date at least a month in the past", 400);
  }

  const [prices, fxRows] = await Promise.all([
    prisma.price.findMany({
      where: {
        instrumentId: { in: instruments.map((i) => i.id) },
        date: { gte: new Date(start.getTime() - 10 * DAY_MS), lte: end },
      },
      orderBy: { date: "asc" },
    }),
    prisma.fxRate.findMany({
      where: { date: { lte: end } },
      orderBy: { date: "asc" },
    }),
  ]);

  const days = [
    ...new Set(
      prices.filter((p) => p.date >= start).map((p) => p.date.getTime()),
    ),
  ].sort((a, b) => a - b);

  const amount = new Decimal(input.amountTetri.toString());
  const depositRate = input.depositRatePct.div(100);
  const inflation = input.inflationPct.div(100);

  // Running state, carried forward day by day
  const lastPrice = new Map<string, Decimal>();
  const lastFx = new Map<string, Decimal>([["GEL", new Decimal(1)]]);
  const units = new Map(instruments.map((i) => [i.id, new Decimal(0)]));
  let invested = new Decimal(0);
  let deposit = new Decimal(0);
  let breakEven = new Decimal(0); // every contribution grown at the inflation rate
  const flows: Flow[] = [];
  const series: {
    date: string;
    investedTetri: string;
    breakEvenTetri: string;
    values: Record<string, string>;
  }[] = [];

  const valueOf = (instId: string, currency: string) =>
    units
      .get(instId)!
      .mul(lastPrice.get(instId)!)
      .mul(lastFx.get(currency)!)
      .mul(100);

  const snapshot = (date: Date) => ({
    date: date.toISOString().slice(0, 10),
    investedTetri: invested.toFixed(0),
    breakEvenTetri: breakEven.toFixed(0, Decimal.ROUND_DOWN),
    values: {
      MATTRESS: invested.toFixed(0),
      DEPOSIT: deposit.toFixed(0, Decimal.ROUND_DOWN),
      ...Object.fromEntries(
        instruments.map((i) => [
          i.symbol,
          valueOf(i.id, i.currency).toFixed(0, Decimal.ROUND_DOWN),
        ]),
      ),
    },
  });

  let pi = 0;
  let fi = 0;
  let prevDay: number | null = null;

  for (const day of days) {
    while (pi < prices.length && prices[pi].date.getTime() <= day) {
      lastPrice.set(
        prices[pi].instrumentId,
        new Decimal(prices[pi].value.toString()),
      );
      pi++;
    }
    while (fi < fxRows.length && fxRows[fi].date.getTime() <= day) {
      lastFx.set(
        fxRows[fi].currency,
        new Decimal(fxRows[fi].gelPerUnit.toString()),
      );
      fi++;
    }

    if (prevDay !== null) {
      const elapsed = (day - prevDay) / DAY_MS;
      deposit = deposit.mul(depositRate.div(365).plus(1).pow(elapsed));
      breakEven = breakEven.mul(inflation.plus(1).pow(elapsed / 365));
    }

    const date = new Date(day);
    const newMonth =
      prevDay === null ||
      new Date(prevDay).getUTCMonth() !== date.getUTCMonth();
    const contribute = input.mode === "lump" ? prevDay === null : newMonth;

    if (contribute) {
      invested = invested.plus(amount);
      deposit = deposit.plus(amount);
      breakEven = breakEven.plus(amount);
      flows.push({ date, amount: -amount.toNumber() });

      for (const inst of instruments) {
        const price = lastPrice.get(inst.id);
        const fx = lastFx.get(inst.currency);
        if (!price || !fx)
          throw new HttpError("Missing market data for the simulation", 503);
        const bought = amount
          .div(price.mul(fx).mul(100))
          .toDecimalPlaces(8, Decimal.ROUND_DOWN);
        units.set(inst.id, units.get(inst.id)!.plus(bought));
      }
    }

    if (newMonth || day === days[days.length - 1]) series.push(snapshot(date));
    prevDay = day;
  }

  const final = series[series.length - 1];
  const endDate = new Date(days[days.length - 1]);

  const options = Object.entries(final.values).map(([key, value]) => {
    const finalValue = new Decimal(value);
    const annual = annualizedReturn([
      ...flows,
      { date: endDate, amount: finalValue.toNumber() },
    ]);
    return {
      key,
      finalTetri: finalValue.toFixed(0),
      profitTetri: finalValue.minus(invested).toFixed(0),
      returnPct: finalValue.div(invested).minus(1).mul(100).toFixed(2),
      annualizedPct: annual === null ? null : (annual * 100).toFixed(2),
      beatsInflation: finalValue.gte(breakEven),
    };
  });

  return {
    startDate: series[0].date,
    endDate: final.date,
    contributions: flows.length,
    investedTetri: invested.toFixed(0),
    breakEvenTetri: breakEven.toFixed(0, Decimal.ROUND_DOWN),
    options,
    series,
  };
}
