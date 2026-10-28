import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api";
import type {
  Instrument,
  Order,
  Portfolio,
  PriceHistory,
  Quote,
} from "./types";

export const queryKeys = {
  portfolio: ["portfolio"] as const,
  orders: ["orders"] as const,
  instruments: ["instruments"] as const,
  quote: (symbol: string) => ["quote", symbol] as const,
  prices: (symbol: string) => ["prices", symbol] as const,
};

export function usePortfolio() {
  return useQuery({
    queryKey: queryKeys.portfolio,
    queryFn: () => apiFetch<Portfolio>("/api/portfolio"),
  });
}

export function useInstruments() {
  return useQuery({
    queryKey: queryKeys.instruments,
    queryFn: () => apiFetch<Instrument[]>("/api/instruments"),
    staleTime: 5 * 60_000, // the instrument list barely ever changes
  });
}

export function useQuote(symbol: string) {
  return useQuery({
    queryKey: queryKeys.quote(symbol),
    queryFn: () => apiFetch<Quote>(`/api/instruments/${symbol}/quote`),
  });
}

export function usePrices(symbol: string) {
  return useQuery({
    queryKey: queryKeys.prices(symbol),
    queryFn: () => apiFetch<PriceHistory>(`/api/instruments/${symbol}/prices`),
    staleTime: 5 * 60_000,
  });
}

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => apiFetch<Order[]>("/api/orders"),
    refetchInterval: (query) =>
      query.state.data?.some((o) => o.status === "PENDING") ? 10_000 : false,
  });
}

export function nameFor(
  item: { nameEn: string; nameKa: string },
  locale: string | undefined,
) {
  return locale === "ka" ? item.nameKa : item.nameEn;
}

export const typeLabels: Record<Instrument["type"], string> = {
  MONEY_MARKET_FUND: "Money market fund",
  BOND_FUND: "Bond fund",
  EQUITY_FUND: "Equity fund",
  STOCK: "Stock",
};

export function isFund(type: Instrument["type"]) {
  return type !== "STOCK";
}
