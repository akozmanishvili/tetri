import Decimal from "decimal.js";

const groups = new Intl.NumberFormat("en-US");

export const STARTING_BALANCE_TETRI = 1_000_000n;

// "1000000" tetri → "10,000.00 gel"
export function formatTetri(tetri: string | bigint): string {
  const value = BigInt(tetri);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const lari = abs / 100n;
  const rest = abs % 100n;
  return `${negative ? "-" : ""}${groups.format(lari)}.${rest.toString().padStart(2, "0")} ₾`;
}

export function formatSignedTetri(tetri: string | bigint): string {
  const value = BigInt(tetri);
  return `${value > 0n ? "+" : ""}${formatTetri(value)}`;
}

// 500 or 500.5 lari typed by the user → 50050n tetri
export function parseLariToTetri(input: string): bigint | null {
  const s = input.trim();
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const [lari, frac = ""] = s.split(".");
  return BigInt(lari) * 100n + BigInt(frac.padEnd(2, "0"));
}

export function formatUnits(units: string, decimals = 4): string {
  return new Decimal(units)
    .toDecimalPlaces(decimals, Decimal.ROUND_DOWN)
    .toString();
}

// profit / cost
export function formatPercent(
  part: string | bigint,
  whole: string | bigint,
): string | null {
  const w = BigInt(whole);
  if (w === 0n) return null;
  const pct = new Decimal(BigInt(part).toString()).div(w.toString()).mul(100);
  return `${pct.gt(0) ? "+" : ""}${pct.toFixed(2)}%`;
}

export function profitColor(tetri: string | bigint): string {
  const v = BigInt(tetri);
  if (v > 0n) return "text-emerald-700";
  if (v < 0n) return "text-red-700";
  return "text-stone-500";
}
