import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Decimal } from "decimal.js";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { settlePendingOrders } from "../services/trading.js";
import { setupMarket, today } from "../test/market.js";

let token: string;
let userId: string;

beforeEach(async () => {
  await setupMarket();
  const res = await request(app)
    .post("/api/auth/signup")
    .send({
      email: "trader@tetri.ge",
      password: "supersecret123",
      displayName: "Trader",
    });
  token = res.body.accessToken;
  userId = res.body.user.id;
});

function order(body: object) {
  return request(app)
    .post("/api/orders")
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

async function balance() {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
  return wallet.balanceTetri;
}

async function expectLedgerMatchesWallet() {
  const sum = await prisma.ledgerEntry.aggregate({
    where: { userId },
    _sum: { amountTetri: true },
  });
  expect(sum._sum.amountTetri).toBe(await balance());
}

describe("stock orders", () => {
  it("buys immediately at price × FX rate", async () => {
    const res = await order({
      symbol: "TSTK",
      side: "BUY",
      amountTetri: "100000",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("EXECUTED");
    expect(new Decimal(res.body.units).eq(4)).toBe(true);
    expect(res.body.fxRate).toBe("2.5");
    expect(await balance()).toBe(900_000n);
    await expectLedgerMatchesWallet();
  });

  it("sells immediately and credits the proceeds", async () => {
    await order({ symbol: "TSTK", side: "BUY", amountTetri: "100000" });
    const res = await order({ symbol: "TSTK", side: "SELL", units: "1" });

    expect(res.status).toBe(201);
    expect(await balance()).toBe(925_000n);
    await expectLedgerMatchesWallet();
  });

  it("rejects selling more than you own", async () => {
    await order({ symbol: "TSTK", side: "BUY", amountTetri: "100000" });
    const res = await order({
      symbol: "TSTK",
      side: "SELL",
      units: "4.00000001",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a buy larger than the balance", async () => {
    const res = await order({
      symbol: "TSTK",
      side: "BUY",
      amountTetri: "1000001",
    });
    expect(res.status).toBe(400);
    expect(await balance()).toBe(1_000_000n);
  });

  it("never overspends, even with simultaneous orders", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        order({ symbol: "TSTK", side: "BUY", amountTetri: "300000" }),
      ),
    );

    expect(results.filter((r) => r.status === 201)).toHaveLength(3);
    expect(results.filter((r) => r.status === 400)).toHaveLength(2);
    expect(await balance()).toBe(100_000n);
    await expectLedgerMatchesWallet();
  });
});

describe("fund orders", () => {
  it("waits for the trade date's NAV, then settles", async () => {
    const res = await order({
      symbol: "TFND",
      side: "BUY",
      amountTetri: "100000",
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
    expect(await balance()).toBe(900_000n); // cash is reserved immediately

    expect(await settlePendingOrders()).toEqual({ settled: 0, waiting: 1 });

    const fund = await prisma.instrument.findUniqueOrThrow({
      where: { symbol: "TFND" },
    });
    await prisma.price.create({
      data: { instrumentId: fund.id, date: today, value: "100" },
    });

    expect(await settlePendingOrders()).toEqual({ settled: 1, waiting: 0 });

    const holding = await prisma.holding.findFirstOrThrow({
      where: { userId, instrumentId: fund.id },
    });
    expect(new Decimal(holding.units.toString()).eq(10)).toBe(true);

    expect(await settlePendingOrders()).toEqual({ settled: 0, waiting: 0 });
    await expectLedgerMatchesWallet();
  });
});

describe("GET /api/portfolio", () => {
  it("counts cash, holdings and pending orders in the total", async () => {
    await order({ symbol: "TSTK", side: "BUY", amountTetri: "100000" }); // executed
    await order({ symbol: "TFND", side: "BUY", amountTetri: "50000" }); // pending

    const res = await request(app)
      .get("/api/portfolio")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.cashTetri).toBe("850000");
    expect(res.body.investedTetri).toBe("100000");
    expect(res.body.pendingTetri).toBe("50000");
    expect(res.body.totalTetri).toBe("1000000");
  });
});
