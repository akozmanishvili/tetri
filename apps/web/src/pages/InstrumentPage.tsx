import { Link, useParams } from "react-router";
import { useAuth } from "../auth/context";
import { PriceChart } from "../components/PriceChart";
import { TradeForm } from "../components/TradeForm";
import { formatTetri } from "../lib/money";
import {
  isFund,
  nameFor,
  typeLabels,
  usePortfolio,
  usePrices,
  useQuote,
} from "../lib/queries";

export function InstrumentPage() {
  const symbol = useParams().symbol!.toUpperCase();
  const { user } = useAuth();
  const quote = useQuote(symbol);
  const prices = usePrices(symbol);
  const portfolio = usePortfolio();

  if (quote.isError) {
    return (
      <p className="text-stone-600">
        Instrument not found.{" "}
        <Link to="/markets" className="text-red-800 underline">
          Back to markets
        </Link>
      </p>
    );
  }
  if (quote.isPending || portfolio.isPending)
    return <p className="text-stone-500">Loading...</p>;
  if (portfolio.isError)
    return <p className="text-red-700">Couldn't load your portfolio.</p>;

  const q = quote.data;
  const holding = portfolio.data.holdings.find((h) => h.symbol === symbol);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/markets"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← Markets
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-bold text-stone-900">
            {nameFor(q, user?.locale)}
          </h1>
          <span className="font-mono text-stone-500">{q.symbol}</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
            {typeLabels[q.type]}
          </span>
        </div>
        <p className="mt-1 text-stone-700">
          <span className="text-xl font-semibold">
            {Number(q.price).toFixed(isFund(q.type) ? 4 : 2)} {q.currency}
          </span>
          {q.currency !== "GEL" && (
            <span className="ml-2 text-sm text-stone-500">
              ≈ {formatTetri(BigInt(Math.floor(Number(q.gelPerUnit) * 100)))}{" "}
              per unit at {Number(q.fxRate).toFixed(4)} GEL/{q.currency}
            </span>
          )}
          <span className="ml-2 text-xs text-stone-400">
            as of {q.priceDate}
          </span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {prices.data ? (
            <PriceChart prices={prices.data.prices} currency={q.currency} />
          ) : (
            <div className="h-80 animate-pulse rounded-2xl bg-stone-100" />
          )}
        </div>
        <TradeForm
          quote={q}
          cashTetri={portfolio.data.cashTetri}
          ownedUnits={holding?.units ?? "0"}
        />
      </div>
    </div>
  );
}
