import Decimal from "decimal.js";
import i18n from "../i18n";

export const STARTING_BALANCE_TETRI = 1_000_000n;

export function localeTag(lang = i18n.language): string {
  return lang === "ka" ? "ka-GE" : "en-US";
}

const formatters = new Map<string, Intl.NumberFormat>();
function numberFormat(tag: string) {
  let nf = formatters.get(tag);
  if (!nf) {
    nf = new Intl.NumberFormat(tag);
    formatters.set(tag, nf);
  }
  return nf;
}

export function formatTetri(
  tetri: string | bigint,
  lang = i18n.language,
): string {
  const nf = numberFormat(localeTag(lang));
  const decimal =
    nf.formatToParts(1.5).find((p) => p.type === "decimal")?.value ?? ".";

  const value = BigInt(tetri);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const lari = abs / 100n;
  const rest = (abs % 100n).toString().padStart(2, "0");

  return `${negative ? "-" : ""}${nf.format(lari)}${decimal}${rest} ₾`;
}

export function formatPercent(
  part: string | bigint,
  whole: string | bigint,
  lang = i18n.language,
): string | null {
  const w = BigInt(whole);
  if (w === 0n) return null;
  const pct = new Decimal(BigInt(part).toString()).div(w.toString()).mul(100);
  const text = new Intl.NumberFormat(localeTag(lang), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pct.toNumber()); // display only
  return `${pct.gt(0) ? "+" : ""}${text}%`;
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

export function profitColor(tetri: string | bigint): string {
  const v = BigInt(tetri);
  if (v > 0n) return "text-emerald-700";
  if (v < 0n) return "text-red-700";
  return "text-stone-500";
}
