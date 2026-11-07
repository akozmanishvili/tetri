// mirror API's responses
export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  locale: "ka" | "en";
  humorEnabled: boolean;
  role: "USER" | "ADMIN";
};

export type Me = PublicUser & { balanceTetri: string };

export type AuthResponse = { accessToken: string; user: PublicUser };

export type Instrument = {
  id: string;
  symbol: string;
  nameEn: string;
  nameKa: string;
  type: "MONEY_MARKET_FUND" | "BOND_FUND" | "EQUITY_FUND" | "STOCK";
  currency: "GEL" | "USD" | "GBP" | "EUR";
  expenseRatioBps: number | null;
};

export type Quote = Instrument & {
  price: string;
  priceDate: string;
  fxRate: string;
  gelPerUnit: string;
};

export type PricePoint = { date: string; value: string };

export type PriceHistory = {
  symbol: string;
  currency: Instrument["currency"];
  prices: PricePoint[];
};

export type HoldingRow = {
  symbol: string;
  nameEn: string;
  nameKa: string;
  type: Instrument["type"];
  currency: Instrument["currency"];
  units: string;
  price: string | null;
  fxRate: string;
  valueTetri: string;
  costBasisTetri: string;
  profitTetri: string;
};

export type Portfolio = {
  cashTetri: string;
  investedTetri: string;
  pendingTetri: string;
  totalTetri: string;
  holdings: HoldingRow[];
};

export type Order = {
  id: string;
  side: "BUY" | "SELL";
  status: "PENDING" | "EXECUTED" | "REJECTED" | "CANCELLED";
  amountTetri: string | null;
  units: string | null;
  executionPrice: string | null;
  fxRate: string | null;
  createdAt: string;
  executedAt: string | null;
  instrument: {
    symbol: string;
    nameEn: string;
    nameKa: string;
    currency: Instrument["currency"];
  };
};

export type PlaceOrderBody =
  | { symbol: string; side: "BUY"; amountTetri: string }
  | { symbol: string; side: "SELL"; units: string };

export type Toast = {
  id: string;
  conceptKey: string;
  emoji: string;
  titleKa: string;
  titleEn: string;
  bodyKa: string;
  bodyEn: string;
  isActive: boolean;
};

export type UnlockedToasts = {
  total: number;
  toasts: (Toast & { unlockedAt: string })[];
};

export type SimulationRequest = {
  amountTetri: string;
  mode: "monthly" | "lump";
  start: string;
  symbols: string[];
  depositRatePct: string;
  inflationPct: string;
};

export type SimulationOption = {
  key: string;
  finalTetri: string;
  profitTetri: string;
  returnPct: string;
  annualizedPct: string | null;
  beatsInflation: boolean;
};

export type SimulationResult = {
  startDate: string;
  endDate: string;
  contributions: number;
  investedTetri: string;
  breakEvenTetri: string;
  options: SimulationOption[];
  series: {
    date: string;
    investedTetri: string;
    breakEvenTetri: string;
    values: Record<string, string>;
  }[];
};
