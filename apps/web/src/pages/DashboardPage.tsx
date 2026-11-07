import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/context";
import { nameFor, usePortfolio } from "../lib/queries";
import { useTamada } from "../tamada/context";
import {
  STARTING_BALANCE_TETRI,
  formatPercent,
  formatSignedTetri,
  formatTetri,
  formatUnits,
  profitColor,
} from "../lib/money";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-stone-900">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: portfolio, isPending, isError } = usePortfolio();

  // Hooks must run on every render, so the triggers go BEFORE the early returns
  useTamada("welcome");
  useTamada("diversification", (portfolio?.holdings.length ?? 0) >= 3);
  useTamada(
    "first_loss",
    portfolio?.holdings.some((h) => BigInt(h.profitTetri) < 0n) ?? false,
  );

  if (isPending) return <p className="text-stone-500">{t("common.loading")}</p>;
  if (isError)
    return <p className="text-red-700">{t("dashboard.loadError")}</p>;

  const totalReturn = BigInt(portfolio.totalTetri) - STARTING_BALANCE_TETRI;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-red-900 p-6 text-white shadow-sm">
        <p className="text-sm opacity-80">
          {t("dashboard.greeting", { name: user?.displayName ?? "" })}
        </p>
        <p className="mt-1 text-4xl font-bold">
          {formatTetri(portfolio.totalTetri)}
        </p>
        <p className="mt-2 text-sm opacity-90">
          {t("dashboard.sinceJoined", {
            amount: formatSignedTetri(totalReturn),
            percent: formatPercent(totalReturn, STARTING_BALANCE_TETRI) ?? "",
          })}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={t("dashboard.cash")}
          value={formatTetri(portfolio.cashTetri)}
        />
        <StatCard
          label={t("dashboard.invested")}
          value={formatTetri(portfolio.investedTetri)}
        />
        <StatCard
          label={t("dashboard.pending")}
          value={formatTetri(portfolio.pendingTetri)}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">
          {t("dashboard.holdings")}
        </h2>

        {portfolio.holdings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="text-stone-600">{t("dashboard.empty")}</p>
            <Link
              to="/markets"
              className="mt-2 inline-block font-medium text-red-800 hover:underline"
            >
              {t("dashboard.browse")}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3">{t("dashboard.colInstrument")}</th>
                  <th className="px-4 py-3 text-right">
                    {t("dashboard.colUnits")}
                  </th>
                  <th className="px-4 py-3 text-right">
                    {t("dashboard.colValue")}
                  </th>
                  <th className="px-4 py-3 text-right">
                    {t("dashboard.colProfit")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map((h) => (
                  <tr
                    key={h.symbol}
                    className="border-t border-stone-100 hover:bg-stone-50"
                  >
                    <td className="px-4 py-3">
                      <Link to={`/instruments/${h.symbol}`} className="block">
                        <span className="font-mono font-semibold">
                          {h.symbol}
                        </span>
                        <span className="ml-2 text-stone-600">
                          {nameFor(h)}
                        </span>
                        <span className="block text-xs text-stone-400">
                          {t(`types.${h.type}`)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatUnits(h.units)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatTetri(h.valueTetri)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${profitColor(h.profitTetri)}`}
                    >
                      {formatSignedTetri(h.profitTetri)}
                      <span className="block text-xs">
                        {formatPercent(h.profitTetri, h.costBasisTetri)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
