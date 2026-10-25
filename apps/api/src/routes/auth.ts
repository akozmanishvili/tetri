import { Router, type CookieOptions, type Response } from "express";
import { z } from "zod";
import { hash, verify } from "@node-rs/argon2";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { isUniqueViolation } from "../lib/errors.js";
import { publicUser } from "../lib/publicUser.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
} from "../lib/tokens.js";

export const authRouter = Router();

const STARTING_BALANCE_TETRI = 1_000_000n; // 10,000.00 GEL
const REFRESH_COOKIE = "tetri_refresh";

const cookieOptions: CookieOptions = {
  httpOnly: true, // XSS can't steal it
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/auth",
};

// validatiob

const signupSchema = z.object({
  email: z.email().transform((e) => e.toLowerCase()),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(50),
  locale: z.enum(["ka", "en"]).default("ka"),
});

const loginSchema = z.object({
  email: z.email().transform((e) => e.toLowerCase()),
  password: z.string().min(1),
});

// helpers

async function issueRefreshToken(res: Response, userId: string) {
  const token = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token), // store only hash
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

// routes

authRouter.post("/signup", async (req, res) => {
  const body = signupSchema.parse(req.body);
  const passwordHash = await hash(body.password);

  try {
    // user + ledger grant + wallet all succeed or none
    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: body.email,
          passwordHash,
          displayName: body.displayName,
          locale: body.locale,
        },
      });
      await tx.ledgerEntry.create({
        data: {
          userId: user.id,
          type: "INITIAL_GRANT",
          amountTetri: STARTING_BALANCE_TETRI,
        },
      });
      await tx.wallet.create({
        data: { userId: user.id, balanceTetri: STARTING_BALANCE_TETRI },
      });
      return user;
    });

    await issueRefreshToken(res, user.id);
    res
      .status(201)
      .json({ accessToken: signAccessToken(user.id), user: publicUser(user) });
  } catch (e) {
    if (isUniqueViolation(e)) {
      res
        .status(409)
        .json({ error: "An account with this email already exists" });
      return;
    }
    throw e;
  }
});

authRouter.post("/login", async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  const valid = user ? await verify(user.passwordHash, body.password) : false;

  // same message for no such user and wrong password so attackers dont get info
  if (!user || !valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  await issueRefreshToken(res, user.id);
  res.json({ accessToken: signAccessToken(user.id), user: publicUser(user) });
});

authRouter.post("/refresh", async (req, res) => {
  const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!stored || stored.expiresAt < new Date()) {
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    res.status(401).json({ error: "Session expired, please log in again" });
    return;
  }

  const { count } = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (count === 0) {
    // Kill every session.
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    res.status(401).json({ error: "Session expired, please log in again" });
    return;
  }

  await issueRefreshToken(res, stored.userId); // rotation: brand new token
  res.json({ accessToken: signAccessToken(stored.userId) });
});

authRouter.post("/logout", async (req, res) => {
  const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.status(204).end();
});
