import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { instrumentsRouter } from "./routes/instruments.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ordersRouter } from "./routes/orders.js";
import { portfolioRouter } from "./routes/portfolio.js";
import crypto from "node:crypto";

export const app = express();

// BigInt converts to string in every JSON response
// Prisma already serializes itself as string.
app.set("json replacer", (_key: string, value: unknown) =>
  typeof value === "bigint" ? value.toString() : value,
);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

app.use((req, res, next) => {
  const expected = env.ORIGIN_VERIFY_SECRET;
  if (expected && !safeEqual(req.get("x-origin-verify") ?? "", expected)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
});

app.get(["/health", "/api/health"], async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", service: "tetri-api", database: "up" });
  } catch {
    res
      .status(503)
      .json({ status: "degraded", service: "tetri-api", database: "down" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/instruments", instrumentsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/portfolio", portfolioRouter);

app.use(errorHandler);
