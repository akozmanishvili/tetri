import { Link } from "react-router";
import { useAuth } from "../auth/context";
import { nameFor, typeLabels, useInstruments } from "../lib/queries";

export function MarketsPage() {
  const { user } = useAuth();
  const { data: instruments, isPending, isError } = useInstruments();

  if (isPending) return <p className="text-stone-500">Loading markets...</p>;
  if (isError) return <p className="text-red-700">Couldn't load markets.</p>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-stone-900">Markets</h1>
      <p className="mb-6 text-stone-600">
        Funds settle at end-of-day NAV. Stocks trade instantly.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {instruments.map((i) => (
          <Link
            key={i.id}
            to={`/instruments/${i.symbol}`}
            className="rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-red-800/40 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold">{i.symbol}</span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                {typeLabels[i.type]}
              </span>
            </div>
            <p className="mt-1 text-stone-800">{nameFor(i, user?.locale)}</p>
            <p className="mt-2 text-xs text-stone-500">
              Priced in {i.currency}
              {i.expenseRatioBps !== null &&
                ` · ${(i.expenseRatioBps / 100).toFixed(2)}% annual fee`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
