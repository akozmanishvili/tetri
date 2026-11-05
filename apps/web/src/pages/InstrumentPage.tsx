import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { PriceChart } from "../components/PriceChart";
import { TradeForm } from "../components/TradeForm";
import { formatNumber, formatTetri } from "../lib/money";
import {
  isFund,
  nameFor,
  usePortfolio,
  usePrices,
  useQuote,
} from "../lib/queries";

export function InstrumentPage() {
  const { t } = useTranslation();
  const symbol = useParams().symbol!.toUpperCase();
  const quote = useQuote(symbol);
  const prices = usePrices(symbol);
  const portfolio = usePortfolio();

  if (quote.isError) {
    return (
      <p className="text-stone-600">
        {t("instrument.notFound")}{" "}
        <Link to="/markets" className="text-red-800 underline">
          {t("instrument.backToMarkets")}
        </Link>
      </p>
    );
  }
  if (quote.isPending || portfolio.isPending)
    return <p className="text-stone-500">{t("common.loading")}</p>;
  if (portfolio.isError)
    return <p className="text-red-700">{t("dashboard.loadError")}</p>;

  const q = quote.data;
  const holding = portfolio.data.holdings.find((h) => h.symbol === symbol);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/markets"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          {t("instrument.back")}
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-bold text-stone-900">{nameFor(q)}</h1>
          <span className="font-mono text-stone-500">{q.symbol}</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
            {t(`types.${q.type}`)}
          </span>
        </div>
        <p className="mt-1 text-stone-700">
          <span className="text-xl font-semibold">
            {formatNumber(q.price, isFund(q.type) ? 4 : 2)} {q.currency}
          </span>
          {q.currency !== "GEL" && (
            <span className="ml-2 text-sm text-stone-500">
              {t("instrument.perUnit", {
                amount: formatTetri(
                  BigInt(Math.floor(Number(q.gelPerUnit) * 100)),
                ),
                rate: formatNumber(q.fxRate, 4),
                currency: q.currency,
              })}
            </span>
          )}
          <span className="ml-2 text-xs text-stone-400">
            {t("instrument.asOf", { date: q.priceDate })}
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
