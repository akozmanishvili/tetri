import { prisma } from "../lib/prisma.js";
import { fetchNbgRates } from "../services/nbg.js";
import { settlePendingOrders } from "../services/trading.js";
import { publishSimulatedPrices } from "./publishPrices.js";

async function updateFxRates() {
  const rates = await fetchNbgRates();
  for (const r of rates) {
    await prisma.fxRate.upsert({
      where: { currency_date: { currency: r.currency, date: r.date } },
      update: { gelPerUnit: r.gelPerUnit },
      create: { currency: r.currency, date: r.date, gelPerUnit: r.gelPerUnit },
    });
  }
  return rates.map((r) => `${r.currency} ${r.gelPerUnit}`);
}

export async function runDailyJobs() {
  const errors: unknown[] = [];
  const summary: Record<string, unknown> = {};

  try {
    summary.fx = await updateFxRates();
  } catch (e) {
    errors.push(e);
    summary.fx = "FAILED";
  }

  try {
    summary.pricesAdded = await publishSimulatedPrices();
  } catch (e) {
    errors.push(e);
    summary.pricesAdded = "FAILED";
  }

  try {
    summary.settlement = await settlePendingOrders();
  } catch (e) {
    errors.push(e);
    summary.settlement = "FAILED";
  }

  console.log(JSON.stringify(summary));
  if (errors.length)
    throw new AggregateError(errors, "Daily jobs had failures");
  return summary;
}
