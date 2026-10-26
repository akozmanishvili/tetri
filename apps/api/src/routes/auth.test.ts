import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

const testUser = {
  email: "test@tetri.ge",
  password: "supersecret123",
  displayName: "Tester",
};

// set-cookie can be missing
function setCookies(res: request.Response): string[] {
  const raw = res.headers["set-cookie"];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

// pull "tetri_refresh out of Set-Cookie header
function refreshCookie(res: request.Response): string {
  const cookie = setCookies(res).find((c) => c.startsWith("tetri_refresh="));
  if (!cookie) throw new Error("No refresh cookie was set");
  return cookie.split(";")[0];
}

async function signup() {
  const res = await request(app).post("/api/auth/signup").send(testUser);
  expect(res.status).toBe(201);
  return {
    res,
    accessToken: res.body.accessToken as string,
    cookie: refreshCookie(res),
  };
}

// signup

describe("POST /api/auth/signup", () => {
  it("creates the user, wallet and ledger grant together", async () => {
    const { res } = await signup();

    expect(res.body.accessToken).toBeTypeOf("string");
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user).not.toHaveProperty("passwordHash");

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: testUser.email },
      include: { wallet: true },
    });
    expect(user.wallet?.balanceTetri).toBe(1_000_000n);

    //  ledger must always add up to wallet balance
    const ledger = await prisma.ledgerEntry.aggregate({
      where: { userId: user.id },
      _sum: { amountTetri: true },
    });
    expect(ledger._sum.amountTetri).toBe(user.wallet?.balanceTetri);
  });

  it("rejects a duplicate email, even with different capitalization", async () => {
    await signup();
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...testUser, email: "TEST@tetri.GE" });
    expect(res.status).toBe(409);
  });

  it("rejects invalid input with a 400", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "not-an-email", password: "short", displayName: "" });
    expect(res.status).toBe(400);
    expect(res.body.issues.length).toBeGreaterThan(0);
  });
});

// login

describe("POST /api/auth/login", () => {
  it("logs in and sets an httpOnly refresh cookie", async () => {
    await signup();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(setCookies(res).find((c) => c.startsWith("tetri_refresh="))).toMatch(
      /HttpOnly/i,
    );
  });

  it("gives identical answers for wrong password and unknown email", async () => {
    await signup();
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "wrong-password" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@tetri.ge", password: "whatever123" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

// protected route

describe("GET /api/me", () => {
  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });

  it("returns the user and balance with a valid token", async () => {
    const { accessToken } = await signup();
    const res = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.balanceTetri).toBe("1000000");
  });
});

// refresh

describe("POST /api/auth/refresh", () => {
  it("rotates the token, and reusing the old one kills ALL sessions", async () => {
    const { cookie: original } = await signup();

    const first = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", original);
    expect(first.status).toBe(200);
    const rotated = refreshCookie(first);
    expect(rotated).not.toBe(original);

    // An attacker replays the old token should reject
    const replay = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", original);
    expect(replay.status).toBe(401);

    // detect reusing too
    const afterReplay = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", rotated);
    expect(afterReplay.status).toBe(401);
  });

  it("lets exactly one of two simultaneous refreshes win", async () => {
    const { cookie } = await signup();

    const results = await Promise.all([
      request(app).post("/api/auth/refresh").set("Cookie", cookie),
      request(app).post("/api/auth/refresh").set("Cookie", cookie),
    ]);

    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 401]);
  });

  it("rejects refresh after logout", async () => {
    const { cookie } = await signup();

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie);
    expect(logout.status).toBe(204);

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookie);
    expect(res.status).toBe(401);
  });
});
