import { Decimal } from "decimal.js";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

Decimal.set({ precision: 40 });

type Tx = Prisma.TransactionClient;

const FUND_TYPES = new Set(["MONEY_MARKET_FUND", "BOND_FUND", "EQUITY_FUND"]);

export class TradingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// helpers

export function startOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// lock this user wallet row until the transaction ends.
async function lockWallet(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT id FROM "Wallet" WHERE "userId" = ${userId} FOR UPDATE`;
}

export async function latestPrice(
  db: Tx,
  instrumentId: string,
  onOrBefore: Date,
) {
  return db.price.findFirst({
    where: { instrumentId, date: { lte: onOrBefore } },
    orderBy: { date: "desc" },
  });
}

export async function fxRate(
  db: Tx,
  currency: string,
  onOrBefore: Date,
): Promise<Decimal> {
  if (currency === "GEL") return new Decimal(1);
  const rate = await db.fxRate.findFirst({
    where: {
      currency: currency as "USD" | "GBP" | "EUR",
      date: { lte: onOrBefore },
    },
    orderBy: { date: "desc" },
  });
  if (!rate) throw new TradingError(`No ${currency}/GEL rate available`, 503);
  return new Decimal(rate.gelPerUnit.toString());
}

// How many units can buy?
function unitsForAmount(
  amountTetri: bigint,
  price: Decimal,
  fx: Decimal,
): Decimal {
  const tetriPerUnit = price.mul(fx).mul(100);
  return new Decimal(amountTetri.toString())
    .div(tetriPerUnit)
    .toDecimalPlaces(8, Decimal.ROUND_DOWN);
}

// what are units worth in tetri?
export function valueInTetri(
  units: Decimal,
  price: Decimal,
  fx: Decimal,
): bigint {
  return BigInt(
    units
      .mul(price)
      .mul(fx)
      .mul(100)
      .toDecimalPlaces(0, Decimal.ROUND_DOWN)
      .toFixed(0),
  );
}

// order

async function fillOrder(
  tx: Tx,
  order: {
    id: string;
    userId: string;
    instrumentId: string;
    side: "BUY" | "SELL";
    amountTetri: bigint | null;
    units: Prisma.Decimal | null;
  },
  currency: string,
  price: { value: Prisma.Decimal; date: Date },
) {
  const p = new Decimal(price.value.toString());
  const fx = await fxRate(tx, currency, price.date);
  const executed = {
    executionPrice: p.toString(),
    fxRate: fx.toString(),
    executedAt: new Date(),
  };

  if (order.side === "BUY") {
    const amount = order.amountTetri!;
    const units = unitsForAmount(amount, p, fx);

    await tx.holding.upsert({
      where: {
        userId_instrumentId: {
          userId: order.userId,
          instrumentId: order.instrumentId,
        },
      },
      create: {
        userId: order.userId,
        instrumentId: order.instrumentId,
        units: units.toString(),
        costBasisTetri: amount,
      },
      update: {
        units: { increment: units.toString() },
        costBasisTetri: { increment: amount },
      },
    });

    return tx.order.update({
      where: { id: order.id },
      data: { ...executed, status: "EXECUTED", units: units.toString() },
    });
  }

  // sell
  const proceeds = valueInTetri(new Decimal(order.units!.toString()), p, fx);

  await tx.wallet.update({
    where: { userId: order.userId },
    data: { balanceTetri: { increment: proceeds } },
  });
  await tx.ledgerEntry.create({
    data: {
      userId: order.userId,
      type: "SELL",
      amountTetri: proceeds,
      orderId: order.id,
    },
  });

  return tx.order.update({
    where: { id: order.id },
    data: { ...executed, status: "EXECUTED" },
  });
}

// place order

export type PlaceOrderInput = { userId: string; symbol: string } & (
  | { side: "BUY"; amountTetri: bigint }
  | { side: "SELL"; units: Decimal }
);

export async function placeOrder(input: PlaceOrderInput) {
  return prisma.$transaction(async (tx) => {
    await lockWallet(tx, input.userId);

    const instrument = await tx.instrument.findUnique({
      where: { symbol: input.symbol },
    });
    if (!instrument || !instrument.isActive)
      throw new TradingError("Unknown instrument", 404);
    const isFund = FUND_TYPES.has(instrument.type);

    let order;

    if (input.side === "BUY") {
      const wallet = await tx.wallet.findUniqueOrThrow({
        where: { userId: input.userId },
      });
      if (wallet.balanceTetri < input.amountTetri)
        throw new TradingError("Insufficient funds");

      order = await tx.order.create({
        data: {
          userId: input.userId,
          instrumentId: instrument.id,
          side: "BUY",
          amountTetri: input.amountTetri,
        },
      });
      // cash out
      await tx.wallet.update({
        where: { userId: input.userId },
        data: { balanceTetri: { decrement: input.amountTetri } },
      });
      await tx.ledgerEntry.create({
        data: {
          userId: input.userId,
          type: "BUY",
          amountTetri: -input.amountTetri,
          orderId: order.id,
        },
      });
    } else {
      const holding = await tx.holding.findUnique({
        where: {
          userId_instrumentId: {
            userId: input.userId,
            instrumentId: instrument.id,
          },
        },
      });
      const owned = new Decimal(holding?.units.toString() ?? 0);
      if (!holding || input.units.gt(owned))
        throw new TradingError("You don't own enough units");

      const basisReduction = BigInt(
        new Decimal(holding.costBasisTetri.toString())
          .mul(input.units)
          .div(owned)
          .toDecimalPlaces(0, Decimal.ROUND_DOWN)
          .toFixed(0),
      );

      // units out
      await tx.holding.update({
        where: { id: holding.id },
        data: {
          units: { decrement: input.units.toString() },
          costBasisTetri: { decrement: basisReduction },
        },
      });
      order = await tx.order.create({
        data: {
          userId: input.userId,
          instrumentId: instrument.id,
          side: "SELL",
          units: input.units.toString(),
        },
      });
    }

    if (isFund) return order; // stays pending until NAV is published

    // stocks execute immediately
    const price = await latestPrice(tx, instrument.id, new Date());
    if (!price)
      throw new TradingError("No price available for this instrument", 503);
    return fillOrder(tx, order, instrument.currency, price);
  });
}

//settlements

// fills every pending order whose NAV has been published.
export async function settlePendingOrders() {
  const pending = await prisma.order.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true },
  });

  let settled = 0;
  let waiting = 0;

  for (const { id, userId } of pending) {
    const done = await prisma.$transaction(async (tx) => {
      await lockWallet(tx, userId);

      const order = await tx.order.findUniqueOrThrow({
        where: { id },
        include: { instrument: true },
      });
      if (order.status !== "PENDING") return false;

      const nav = await tx.price.findFirst({
        where: {
          instrumentId: order.instrumentId,
          date: { gte: startOfUtcDay(order.createdAt) },
        },
        orderBy: { date: "asc" },
      });
      if (!nav) return false; // NAV not published yet so try again next run

      await fillOrder(tx, order, order.instrument.currency, nav);
      return true;
    });

    if (done) settled++;
    else waiting++;
  }

  return { settled, waiting };
}
