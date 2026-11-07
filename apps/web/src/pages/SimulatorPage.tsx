import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch, getErrorMessage } from "../lib/api";
import {
  formatNumber,
  formatSignedTetri,
  formatTetri,
  parseLariToTetri,
  profitColor,
} from "../lib/money";
import { nameFor, useInstruments } from "../lib/queries";
import { useTamadaContext } from "../tamada/context";
import type { SimulationRequest, SimulationResult } from "../lib/types";

const COLORS = [
  "#78716c",
  "#1d4ed8",
  "#991b1b",
  "#047857",
  "#b45309",
  "#7c3aed",
  "#0f766e",
  "#be185d",
  "#4d7c0f",
  "#0369a1",
];
const DEFAULT_PICKS = ["TMMF", "TBND", "TGEQ", "BGEO"];

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/20";

function monthsAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString().slice(0, 10);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-stone-600">{label}</span>
      {children}
    </label>
  );
}

export function SimulatorPage() {
  const { t } = useTranslation();
  const { unlock } = useTamadaContext();
  const instruments = useInstruments();

  const [amount, setAmount] = useState("100");
  const [mode, setMode] = useState<"monthly" | "lump">("monthly");
  const [start, setStart] = useState(() => monthsAgo(6));
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_PICKS);
  const [depositRate, setDepositRate] = useState("10");
  const [inflation, setInflation] = useState("3");
  const [formError, setFormError] = useState<string | null>(null);

  const sim = useMutation({
    mutationFn: (body: SimulationRequest) =>
      apiFetch<SimulationResult>("/api/simulator", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (result) => {
      unlock("compounding");
      if (result.options.some((o) => o.key === "MATTRESS" && !o.beatsInflation))
        unlock("inflation");
    },
  });

  function toggle(symbol: string) {
    setSymbols((s) =>
      s.includes(symbol) ? s.filter((x) => x !== symbol) : [...s, symbol],
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const tetri = parseLariToTetri(amount);
    if (tetri === null || tetri < 100n) {
      setFormError(t("trade.invalidAmount"));
      return;
    }
    if (symbols.length === 0) {
      setFormError(t("simulator.pickOne"));
      return;
    }
    setFormError(null);
    sim.mutate({
      amountTetri: tetri.toString(),
      mode,
      start,
      symbols,
      depositRatePct: depositRate.trim(),
      inflationPct: inflation.trim(),
    });
  }

  function label(key: string) {
    if (key === "MATTRESS") return t("simulator.mattress");
    if (key === "DEPOSIT") return t("simulator.deposit");
    const inst = instruments.data?.find((i) => i.symbol === key);
    return inst ? `${key} · ${nameFor(inst)}` : key;
  }

  const result = sim.data;
  const keys = result ? Object.keys(result.series[0].values) : [];

  const chartData =
    result?.series.map((p) => ({
      date: p.date,
      breakEven: Number(p.breakEvenTetri) / 100,
      ...Object.fromEntries(
        Object.entries(p.values).map(([k, v]) => [k, Number(v) / 100]),
      ),
    })) ?? [];

  const ranked = result
    ? [...result.options].sort((a, b) =>
        BigInt(b.finalTetri) > BigInt(a.finalTetri) ? 1 : -1,
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          {t("simulator.title")}
        </h1>
        <p className="mt-1 text-stone-600">{t("simulator.subtitle")}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-2xl border border-stone-200 bg-white p-4 lg:grid-cols-2"
      >
        <div className="space-y-4">
          <Field label={t("simulator.amount")}>
            <input
              className={`${inputClass} font-mono`}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1">
            {(["monthly", "lump"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md py-1.5 text-sm font-medium ${mode === m ? "bg-white shadow-sm" : "text-stone-500"}`}
              >
                {t(`simulator.${m}`)}
              </button>
            ))}
          </div>

          <Field label={t("simulator.start")}>
            <input
              type="date"
              className={inputClass}
              value={start}
              max={monthsAgo(1)}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("simulator.depositRate")}>
              <input
                className={`${inputClass} font-mono`}
                inputMode="decimal"
                value={depositRate}
                onChange={(e) => setDepositRate(e.target.value)}
              />
            </Field>
            <Field label={t("simulator.inflation")}>
              <input
                className={`${inputClass} font-mono`}
                inputMode="decimal"
                value={inflation}
                onChange={(e) => setInflation(e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-stone-600">
            {t("simulator.instruments")}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {instruments.data?.map((i) => (
              <label
                key={i.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-red-800"
                  checked={symbols.includes(i.symbol)}
                  onChange={() => toggle(i.symbol)}
                />
                <span className="font-mono font-semibold">{i.symbol}</span>
                <span className="truncate text-stone-600">{nameFor(i)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {(formError || sim.isError) && (
            <p className="mb-3 text-sm text-red-700">
              {formError ?? getErrorMessage(sim.error)}
            </p>
          )}
          <button
            disabled={sim.isPending}
            className="w-full rounded-lg bg-red-800 px-4 py-2 font-medium text-white hover:bg-red-900 disabled:opacity-50 sm:w-auto"
          >
            {sim.isPending ? t("simulator.running") : t("simulator.run")}
          </button>
        </div>
      </form>

      {result && (
        <section className="space-y-4">
          <p className="text-sm text-stone-600">
            {t("simulator.period", {
              start: result.startDate,
              end: result.endDate,
              n: result.contributions,
              invested: formatTetri(result.investedTetri),
            })}
          </p>

          <div className="h-96 rounded-2xl border border-stone-200 bg-white p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e7e5e4"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  minTickGap={40}
                  stroke="#a8a29e"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  width={70}
                  stroke="#a8a29e"
                  tickFormatter={(v: number) => formatNumber(v, 0)}
                />
                <Tooltip formatter={(v) => `${formatNumber(Number(v), 2)} ₾`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {keys.map((k, i) => (
                  <Line
                    key={k}
                    type="monotone"
                    dataKey={k}
                    name={label(k)}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="breakEven"
                  name={t("simulator.breakEven")}
                  stroke="#a8a29e"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3">{t("simulator.colOption")}</th>
                  <th className="px-4 py-3 text-right">
                    {t("simulator.colFinal")}
                  </th>
                  <th className="px-4 py-3 text-right">
                    {t("simulator.colProfit")}
                  </th>
                  <th className="px-4 py-3 text-right">
                    {t("simulator.colReturn")}
                  </th>
                  <th className="px-4 py-3 text-right">
                    {t("simulator.colAnnual")}
                  </th>
                  <th className="px-4 py-3">{t("simulator.colInflation")}</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((o) => (
                  <tr key={o.key} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {label(o.key)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatTetri(o.finalTetri)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${profitColor(o.profitTetri)}`}
                    >
                      {formatSignedTetri(o.profitTetri)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatNumber(o.returnPct, 2)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.annualizedPct === null
                        ? "—"
                        : `${formatNumber(o.annualizedPct, 2)}%`}
                    </td>
                    <td
                      className={`px-4 py-3 ${o.beatsInflation ? "text-emerald-700" : "text-red-700"}`}
                    >
                      {o.beatsInflation
                        ? t("simulator.beats")
                        : t("simulator.loses")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-stone-500">
            {t("simulator.assumptions")} {t("simulator.perYearHint")}
          </p>
        </section>
      )}
    </div>
  );
}
