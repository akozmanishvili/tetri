import { prisma } from "../lib/prisma.js";
import { startOfUtcDay } from "../services/trading.js";

const PROFILES = {
  MONEY_MARKET_FUND: { ret: 0.075, vol: 0.003 },
  BOND_FUND: { ret: 0.09, vol: 0.05 },
  EQUITY_FUND: { ret: 0.08, vol: 0.16 },
  STOCK: { ret: 0.12, vol: 0.28 },
} as const;

function randNormal() {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function nextValue(prev: number, ret: number, vol: number) {
  const dt = 1 / 252;
  return (
    prev *
    Math.exp((ret - vol ** 2 / 2) * dt + vol * Math.sqrt(dt) * randNormal())
  );
}

function missingBusinessDays(after: Date): Date[] {
  const days: Date[] = [];
  const today = startOfUtcDay(new Date());
  const d = startOfUtcDay(after);
  d.setUTCDate(d.getUTCDate() + 1);
  while (d <= today) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

export async function publishSimulatedPrices(): Promise<number> {
  const instruments = await prisma.instrument.findMany({
    where: { isActive: true },
  });
  let added = 0;

  for (const instrument of instruments) {
    const last = await prisma.price.findFirst({
      where: { instrumentId: instrument.id },
      orderBy: { date: "desc" },
    });
    if (!last) continue;

    const { ret, vol } = PROFILES[instrument.type];
    let value = Number(last.value);
    const rows = missingBusinessDays(last.date).map((date) => {
      value = nextValue(value, ret, vol);
      return { instrumentId: instrument.id, date, value: value.toFixed(6) };
    });

    const { count } = await prisma.price.createMany({
      data: rows,
      skipDuplicates: true,
    });
    added += count;
  }

  return added;
}
