import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  formatNumber,
  formatTetri,
  formatUnits,
  localeTag,
} from "../lib/money";
import { useOrders } from "../lib/queries";
import type { Order } from "../lib/types";

const statusStyles: Record<Order["status"], string> = {
  PENDING: "bg-amber-100 text-amber-900",
  EXECUTED: "bg-emerald-100 text-emerald-900",
  REJECTED: "bg-red-100 text-red-900",
  CANCELLED: "bg-stone-100 text-stone-600",
};

export function OrdersPage() {
  const { t } = useTranslation();
  const { data: orders, isPending, isError } = useOrders();

  if (isPending) return <p className="text-stone-500">{t("common.loading")}</p>;
  if (isError) return <p className="text-red-700">{t("orders.loadError")}</p>;

  function describe(o: Order): string {
    if (o.side === "BUY") {
      const amount = formatTetri(o.amountTetri ?? "0");
      return o.units
        ? `${amount} → ${t("orders.units", { units: formatUnits(o.units) })}`
        : t("orders.atNav", { amount });
    }
    return t("orders.units", { units: formatUnits(o.units ?? "0") });
  }

  const hasPending = orders.some((o) => o.status === "PENDING");

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-stone-900">
        {t("orders.title")}
      </h1>
      <p className="mb-6 text-stone-600">
        {hasPending ? t("orders.pendingNote") : t("orders.history")}
      </p>

      {orders.length === 0 ? (
        <p className="text-stone-500">
          {t("orders.empty")}{" "}
          <Link to="/markets" className="text-red-800 underline">
            {t("orders.firstTrade")}
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3">{t("orders.colDate")}</th>
                <th className="px-4 py-3">{t("orders.colInstrument")}</th>
                <th className="px-4 py-3">{t("orders.colSide")}</th>
                <th className="px-4 py-3">{t("orders.colDetails")}</th>
                <th className="px-4 py-3">{t("orders.colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-stone-100">
                  <td className="px-4 py-3 text-stone-500">
                    {new Date(o.createdAt).toLocaleString(localeTag())}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/instruments/${o.instrument.symbol}`}
                      className="font-mono font-semibold hover:underline"
                    >
                      {o.instrument.symbol}
                    </Link>
                  </td>
                  <td
                    className={`px-4 py-3 font-medium ${o.side === "BUY" ? "text-emerald-700" : "text-red-700"}`}
                  >
                    {t(`orders.side.${o.side}`)}
                  </td>
                  <td className="px-4 py-3">
                    {describe(o)}
                    {o.executionPrice && (
                      <span className="block text-xs text-stone-400">
                        @ {formatNumber(o.executionPrice, 4)}{" "}
                        {o.instrument.currency}
                        {o.instrument.currency !== "GEL" &&
                          o.fxRate &&
                          ` · FX ${formatNumber(o.fxRate, 4)}`}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[o.status]}`}
                    >
                      {t(`orders.status.${o.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
