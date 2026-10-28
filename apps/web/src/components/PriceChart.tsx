import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "../lib/types";

const RANGES = { "1M": 21, "3M": 63, "6M": 126, "1Y": Infinity } as const; // trading days
type Range = keyof typeof RANGES;

export function PriceChart({
  prices,
  currency,
}: {
  prices: PricePoint[];
  currency: string;
}) {
  const [range, setRange] = useState<Range>("3M");

  const data = prices
    .slice(-RANGES[range])
    .map((p) => ({ date: p.date, value: Number(p.value) }));
  const first = data[0]?.value ?? 0;
  const last = data.at(-1)?.value ?? 0;
  const up = last >= first;
  const color = up ? "#047857" : "#b91c1c";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p
          className={`text-sm font-medium ${up ? "text-emerald-700" : "text-red-700"}`}
        >
          {up ? "▲" : "▼"}{" "}
          {first ? (((last - first) / first) * 100).toFixed(2) : "0.00"}% over{" "}
          {range}
        </p>
        <div className="flex gap-1">
          {(Object.keys(RANGES) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                r === range
                  ? "bg-stone-900 text-white"
                  : "text-stone-500 hover:bg-stone-100"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
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
              domain={["auto", "auto"]}
              tick={{ fontSize: 11 }}
              width={60}
              stroke="#a8a29e"
              tickFormatter={(v: number) => v.toFixed(2)}
            />
            <Tooltip formatter={(v) => `${Number(v).toFixed(4)} ${currency}`} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#priceFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
