import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
    algorithm: "HS256",
  });
}

export function verifyAccessToken(token: string): string {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ["HS256"],
  });
  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Invalid token payload");
  }
  return payload.sub;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
