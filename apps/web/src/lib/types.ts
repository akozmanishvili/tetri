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
