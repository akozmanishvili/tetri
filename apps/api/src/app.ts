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

app.get("/health", async (_req, res) => {
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
