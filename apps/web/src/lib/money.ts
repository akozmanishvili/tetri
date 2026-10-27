const groups = new Intl.NumberFormat("en-US");

export function formatTetri(tetri: string | bigint): string {
  const value = BigInt(tetri);
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const lari = abs / 100n;
  const rest = abs % 100n;
  return `${negative ? "-" : ""}${groups.format(lari)}.${rest.toString().padStart(2, "0")} ₾`;
}
