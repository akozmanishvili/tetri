import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchNbgRates } from "./nbg.js";

function stubNbg(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchNbgRates", () => {
  it("keeps only USD, EUR, GBP and converts quantity to a per-unit rate", async () => {
    stubNbg([
      {
        date: "2026-11-02T00:00:00.000Z",
        currencies: [
          {
            code: "USD",
            quantity: 1,
            rate: 2.6229,
            validFromDate: "2026-11-02T00:00:00.000Z",
          },
          {
            code: "GBP",
            quantity: 1,
            rate: 3.4567,
            validFromDate: "2026-11-02T00:00:00.000Z",
          },
          {
            code: "EUR",
            quantity: 1,
            rate: 2.9925,
            validFromDate: "2026-11-02T00:00:00.000Z",
          },
          {
            code: "JPY",
            quantity: 100,
            rate: 1.75,
            validFromDate: "2026-11-02T00:00:00.000Z",
          },
        ],
      },
    ]);

    const rates = await fetchNbgRates();

    expect(rates.map((r) => r.currency).sort()).toEqual(["EUR", "GBP", "USD"]);
    expect(rates.find((r) => r.currency === "USD")?.gelPerUnit).toBe(
      "2.622900",
    );
    expect(rates[0].date.toISOString()).toBe("2026-11-02T00:00:00.000Z");
  });

  it("fails loudly when the format changes", async () => {
    stubNbg([{ unexpected: "shape" }]);
    await expect(fetchNbgRates()).rejects.toThrow();
  });

  it("fails loudly when NBG is down", async () => {
    stubNbg({}, 503);
    await expect(fetchNbgRates()).rejects.toThrow("503");
  });
});
