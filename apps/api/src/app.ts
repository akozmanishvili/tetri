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

export const app = express();

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

app.use(errorHandler);
