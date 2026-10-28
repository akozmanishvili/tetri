import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { apiFetch, getErrorMessage } from "../lib/api";
import { formatTetri, formatUnits, parseLariToTetri } from "../lib/money";
import { isFund, queryKeys } from "../lib/queries";
import type { Order, PlaceOrderBody, Quote } from "../lib/types";

type Props = {
  quote: Quote;
  cashTetri: string;
  ownedUnits: string;
};

export function TradeForm({ quote, cashTetri, ownedUnits }: Props) {
  const queryClient = useQueryClient();
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [input, setInput] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const fund = isFund(quote.type);
  const gelPerUnit = new Decimal(quote.gelPerUnit);
  const owned = new Decimal(ownedUnits);

  // validations
  let preview: string | null = null;
  let problem: string | null = null;

  if (input.trim() !== "") {
    if (side === "BUY") {
      const tetri = parseLariToTetri(input);
      if (tetri === null) problem = "Enter an amount like 500 or 250.50";
      else if (tetri < 100n) problem = "Minimum order is 1 GEL";
      else if (tetri > BigInt(cashTetri))
        problem = "That's more cash than you have";
      else {
        const units = new Decimal(tetri.toString()).div(100).div(gelPerUnit);
        preview = `≈ ${formatUnits(units.toString())} units`;
      }
    } else {
      if (!/^\d+(\.\d{1,8})?$/.test(input.trim()))
        problem = "Enter units, e.g. 2.5";
      else {
        const units = new Decimal(input.trim());
        if (units.lte(0)) problem = "Units must be positive";
        else if (units.gt(owned)) problem = "You don't own that many units";
        else {
          const tetri = units
            .mul(gelPerUnit)
            .mul(100)
            .toDecimalPlaces(0, Decimal.ROUND_DOWN);
          preview = `≈ ${formatTetri(tetri.toFixed(0))}`;
        }
      }
    }
  }

  // submit
  const mutation = useMutation({
    mutationFn: (body: PlaceOrderBody) =>
      apiFetch<Order>("/api/orders", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      setInput("");
      setSuccess(
        order.status === "PENDING"
          ? "Order placed! It will execute at today's NAV after the market closes."
          : order.side === "BUY"
            ? `Done! You bought ${formatUnits(order.units ?? "0")} units.`
            : "Done! The proceeds are in your cash balance.",
      );
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (problem || !input.trim()) return;
    setSuccess(null);

    if (side === "BUY") {
      mutation.mutate({
        symbol: quote.symbol,
        side,
        amountTetri: parseLariToTetri(input)!.toString(),
      });
    } else {
      mutation.mutate({ symbol: quote.symbol, side, units: input.trim() });
    }
  }

  function switchSide(next: "BUY" | "SELL") {
    setSide(next);
    setInput("");
    setSuccess(null);
    mutation.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-200 bg-white p-4"
    >
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1">
        {(["BUY", "SELL"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => switchSide(s)}
            disabled={s === "SELL" && owned.lte(0)}
            className={`rounded-md py-1.5 text-sm font-medium disabled:opacity-40 ${
              side === s ? "bg-white shadow-sm" : "text-stone-500"
            }`}
          >
            {s === "BUY" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      <label className="mb-1 block text-sm text-stone-600">
        {side === "BUY" ? "Amount (GEL)" : "Units to sell"}
      </label>
      <div className="flex gap-2">
        <input
          className="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/20"
          inputMode="decimal"
          placeholder={side === "BUY" ? "500" : "1.5"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        {side === "SELL" && (
          <button
            type="button"
            onClick={() => setInput(owned.toString())}
            className="rounded-lg border border-stone-300 px-3 text-sm text-stone-600 hover:bg-stone-50"
          >
            Max
          </button>
        )}
      </div>

      <p className="mt-2 min-h-5 text-sm">
        {problem ? (
          <span className="text-red-700">{problem}</span>
        ) : (
          <span className="text-stone-600">{preview}</span>
        )}
      </p>

      <p className="mt-1 text-xs text-stone-500">
        {side === "BUY"
          ? `Cash available: ${formatTetri(cashTetri)}`
          : `You own ${formatUnits(ownedUnits, 8)} units`}
      </p>

      {fund && (
        <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
          🍷 Funds don't trade instantly: your order executes at the end-of-day
          NAV, so the final number may differ slightly from this preview.
        </p>
      )}

      {mutation.isError && (
        <p className="mt-3 text-sm text-red-700">
          {getErrorMessage(mutation.error)}
        </p>
      )}
      {success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}

      <button
        disabled={!!problem || !input.trim() || mutation.isPending}
        className="mt-4 w-full rounded-lg bg-red-800 px-4 py-2 font-medium text-white hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mutation.isPending
          ? "Placing order..."
          : `${side === "BUY" ? "Buy" : "Sell"} ${quote.symbol}`}
      </button>
    </form>
  );
}
