import { prisma } from "../lib/prisma.js";
import { startOfUtcDay } from "../services/trading.js";

export const today = startOfUtcDay(new Date());
export const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

export async function setupMarket() {
  const stock = await prisma.instrument.upsert({
    where: { symbol: "TSTK" },
    update: {},
    create: {
      symbol: "TSTK",
      nameEn: "Test Stock",
      nameKa: "ტესტი",
      type: "STOCK",
      currency: "USD",
    },
  });
  const fund = await prisma.instrument.upsert({
    where: { symbol: "TFND" },
    update: {},
    create: {
      symbol: "TFND",
      nameEn: "Test Fund",
      nameKa: "ტესტ ფონდი",
      type: "MONEY_MARKET_FUND",
      currency: "GEL",
      expenseRatioBps: 50,
    },
  });

  await prisma.price.deleteMany({
    where: { instrumentId: { in: [stock.id, fund.id] } },
  });
  await prisma.price.createMany({
    data: [
      { instrumentId: stock.id, date: yesterday, value: "100" },
      { instrumentId: fund.id, date: yesterday, value: "100" },
    ],
  });
  await prisma.fxRate.upsert({
    where: { currency_date: { currency: "USD", date: yesterday } },
    update: { gelPerUnit: "2.5" },
    create: { currency: "USD", date: yesterday, gelPerUnit: "2.5" },
  });

  return { stock, fund };
}
