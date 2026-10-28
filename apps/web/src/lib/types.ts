// mirror API's responses
export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  locale: "ka" | "en";
  humorEnabled: boolean;
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
