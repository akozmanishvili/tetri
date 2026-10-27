import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/context";
import { apiFetch } from "../lib/api";
import { formatTetri } from "../lib/money";
import type { Instrument, Me } from "../lib/types";

const typeLabels: Record<Instrument["type"], string> = {
  MONEY_MARKET_FUND: "Money market fund",
  BOND_FUND: "Bond fund",
  EQUITY_FUND: "Equity fund",
  STOCK: "Stock",
};

export function DashboardPage() {
  const { logout } = useAuth();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<Me>("/api/me"),
  });
  const instruments = useQuery({
    queryKey: ["instruments"],
    queryFn: () => apiFetch<Instrument[]>("/api/instruments"),
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-red-900">Tetri</h1>
        <button
          onClick={logout}
          className="text-sm text-stone-600 hover:text-red-800"
        >
          Log out
        </button>
      </header>

      <section className="mb-8 rounded-2xl bg-red-900 p-6 text-white shadow-sm">
        <p className="text-sm opacity-80">
          Gamarjoba{me.data ? `, ${me.data.displayName}` : ""}! Your cash
          balance
        </p>
        <p className="mt-1 text-4xl font-bold">
          {me.data ? formatTetri(me.data.balanceTetri) : "..."}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">
          What you can invest in
        </h2>
        {instruments.isPending && <p className="text-stone-500">Loading...</p>}
        {instruments.isError && (
          <p className="text-red-700">Couldn't load instruments.</p>
        )}
        {instruments.data && (
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Currency</th>
                  <th className="px-4 py-3">Annual fee</th>
                </tr>
              </thead>
              <tbody>
                {instruments.data.map((i) => (
                  <tr key={i.id} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-mono font-semibold">
                      {i.symbol}
                    </td>
                    <td className="px-4 py-3">
                      {me.data?.locale === "ka" ? i.nameKa : i.nameEn}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {typeLabels[i.type]}
                    </td>
                    <td className="px-4 py-3">{i.currency}</td>
                    <td className="px-4 py-3">
                      {i.expenseRatioBps === null
                        ? "—"
                        : `${(i.expenseRatioBps / 100).toFixed(2)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
