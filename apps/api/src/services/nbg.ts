import { Decimal } from "decimal.js";
import { z } from "zod";

const NBG_URL =
  "https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/";
const TRACKED = ["USD", "EUR", "GBP"] as const;
type Tracked = (typeof TRACKED)[number];

const nbgSchema = z
  .array(
    z.object({
      date: z.string(),
      currencies: z.array(
        z.object({
          code: z.string(),
          quantity: z.number().positive().default(1),
          rate: z.number().positive(),
          validFromDate: z.string().optional(),
        }),
      ),
    }),
  )
  .min(1);

export type NbgRate = { currency: Tracked; date: Date; gelPerUnit: string };

export async function fetchNbgRates(): Promise<NbgRate[]> {
  const res = await fetch(NBG_URL, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`NBG API responded with ${res.status}`);

  const [table] = nbgSchema.parse(await res.json());

  return table.currencies
    .filter((c): c is typeof c & { code: Tracked } =>
      (TRACKED as readonly string[]).includes(c.code),
    )
    .map((c) => {
      const day = (c.validFromDate ?? table.date).slice(0, 10);
      return {
        currency: c.code,
        date: new Date(`${day}T00:00:00Z`),
        gelPerUnit: new Decimal(c.rate).div(c.quantity).toFixed(6),
      };
    });
}
