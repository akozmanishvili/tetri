import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { nameFor, useInstruments } from "../lib/queries";
import { formatNumber } from "../lib/money";

export function MarketsPage() {
  const { t } = useTranslation();
  const { data: instruments, isPending, isError } = useInstruments();

  if (isPending) return <p className="text-stone-500">{t("common.loading")}</p>;
  if (isError) return <p className="text-red-700">{t("markets.loadError")}</p>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-stone-900">
        {t("markets.title")}
      </h1>
      <p className="mb-6 text-stone-600">{t("markets.subtitle")}</p>

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
                {t(`types.${i.type}`)}
              </span>
            </div>
            <p className="mt-1 text-stone-800">{nameFor(i)}</p>
            <p className="mt-2 text-xs text-stone-500">
              {t("markets.pricedIn", { currency: i.currency })}
              {i.expenseRatioBps !== null &&
                ` · ${t("markets.annualFee", { fee: formatNumber(i.expenseRatioBps / 100, 2) })}`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
