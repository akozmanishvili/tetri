import { Decimal } from "decimal.js";
import { prisma } from "../lib/prisma.js";
import { fxRate, latestPrice, valueInTetri } from "./trading.js";

export async function getPortfolio(userId: string) {
  const now = new Date();

  const [wallet, holdings, pendingOrders] = await Promise.all([
    prisma.wallet.findUniqueOrThrow({ where: { userId } }),
    prisma.holding.findMany({
      where: { userId, units: { gt: 0 } },
      include: { instrument: true },
    }),
    prisma.order.findMany({
      where: { userId, status: "PENDING" },
      include: { instrument: true },
    }),
  ]);

  let investedTetri = 0n;
  const rows = [];

  for (const h of holdings) {
    const price = await latestPrice(prisma, h.instrumentId, now);
    const fx = await fxRate(prisma, h.instrument.currency, now);
    const value = price
      ? valueInTetri(
          new Decimal(h.units.toString()),
          new Decimal(price.value.toString()),
          fx,
        )
      : 0n;
    investedTetri += value;

    rows.push({
      symbol: h.instrument.symbol,
      nameEn: h.instrument.nameEn,
      nameKa: h.instrument.nameKa,
      type: h.instrument.type,
      currency: h.instrument.currency,
      units: h.units.toString(),
      price: price?.value.toString() ?? null,
      fxRate: fx.toString(),
      valueTetri: value,
      costBasisTetri: h.costBasisTetri,
      profitTetri: value - h.costBasisTetri,
    });
  }

  let pendingTetri = 0n;
  for (const o of pendingOrders) {
    if (o.side === "BUY") {
      pendingTetri += o.amountTetri ?? 0n;
    } else {
      const price = await latestPrice(prisma, o.instrumentId, now);
      const fx = await fxRate(prisma, o.instrument.currency, now);
      if (price)
        pendingTetri += valueInTetri(
          new Decimal(o.units!.toString()),
          new Decimal(price.value.toString()),
          fx,
        );
    }
  }

  return {
    cashTetri: wallet.balanceTetri,
    investedTetri,
    pendingTetri,
    totalTetri: wallet.balanceTetri + investedTetri + pendingTetri,
    holdings: rows,
  };
}
