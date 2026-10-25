import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      issues: err.issues.map((i) => ({
        path: i.path.map(String).join("."),
        message: i.message,
      })),
    });
    return;
  }

  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Malformed JSON body" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
