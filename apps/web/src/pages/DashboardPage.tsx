import { Link } from "react-router";
import { useAuth } from "../auth/context";
import { nameFor, typeLabels, usePortfolio } from "../lib/queries";
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
  const { user } = useAuth();
  const { data: portfolio, isPending, isError } = usePortfolio();

  if (isPending)
    return <p className="text-stone-500">Loading your portfolio...</p>;
  if (isError)
    return <p className="text-red-700">Couldn't load your portfolio.</p>;

  const totalReturn = BigInt(portfolio.totalTetri) - STARTING_BALANCE_TETRI;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-red-900 p-6 text-white shadow-sm">
        <p className="text-sm opacity-80">
          Gamarjoba, {user?.displayName}! Your total wealth
        </p>
        <p className="mt-1 text-4xl font-bold">
          {formatTetri(portfolio.totalTetri)}
        </p>
        <p className="mt-2 text-sm opacity-90">
          {formatSignedTetri(totalReturn)} (
          {formatPercent(totalReturn, STARTING_BALANCE_TETRI)}) since you joined
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Cash" value={formatTetri(portfolio.cashTetri)} />
        <StatCard
          label="Invested"
          value={formatTetri(portfolio.investedTetri)}
        />
        <StatCard
          label="Pending orders"
          value={formatTetri(portfolio.pendingTetri)}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">
          Your holdings
        </h2>

        {portfolio.holdings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="text-stone-600">You don't own anything yet.</p>
            <Link
              to="/markets"
              className="mt-2 inline-block font-medium text-red-800 hover:underline"
            >
              Browse the markets →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3">Instrument</th>
                  <th className="px-4 py-3 text-right">Units</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3 text-right">Profit / loss</th>
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
                          {nameFor(h, user?.locale)}
                        </span>
                        <span className="block text-xs text-stone-400">
                          {typeLabels[h.type]}
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
