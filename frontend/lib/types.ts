// TypeScript mirrors of the backend Pydantic schemas (backend/app/schemas).
// Numeric fields arrive as JSON numbers; *_pct fields are already percentages
// (e.g. 18.5 == 18.5%). TWR/XIRR arrive as fractions (0.0488 == 4.88%).

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: "BROKERAGE" | "RETIREMENT" | string;
  institution: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  asset_class: "EQUITY" | "ETF" | string;
  sector: string | null;
  is_active: boolean;
}

export interface Holding {
  account_id: string;
  account_name: string;
  asset_id: string;
  symbol: string;
  name: string;
  asset_class: string;
  sector: string | null;
  quantity: number;
  avg_cost_per_share: number;
  cost_basis: number;
  realized_pnl: number;
  current_price: number | null;
  market_value: number | null;
  unrealized_pnl: number | null;
  unrealized_pnl_pct: number | null;
  price_date: string | null;
  price_is_stale: boolean;
}

export interface PortfolioSummary {
  total_market_value: number;
  total_cost_basis: number;
  total_unrealized_pnl: number;
  total_unrealized_pnl_pct: number;
  total_realized_pnl: number;
  total_cash: number;
  holdings: Holding[];
  price_stale: boolean;
  as_of: string;
}

export interface PeriodReturn {
  period: string;
  twr: number | null;
  xirr: number | null;
}

export interface PerformanceRead {
  returns: PeriodReturn[];
}

export interface AllocationItem {
  label: string;
  market_value: number;
  weight: number; // percentage
}

export interface AllocationRead {
  group_by: string;
  items: AllocationItem[];
  total_market_value: number;
}

export type TransactionType =
  | "BUY"
  | "SELL"
  | "DIVIDEND"
  | "SPLIT"
  | "DEPOSIT"
  | "WITHDRAWAL";

export interface Transaction {
  id: string;
  account_id: string;
  asset_id: string | null;
  type: TransactionType | string;
  trade_date: string;
  quantity: number;
  price: number;
  fees: number;
  notes: string | null;
  created_at: string;
  symbol: string | null;
  account_name: string | null;
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
}

export interface TransactionCreate {
  account_id: string;
  asset_id?: string | null;
  type: TransactionType;
  trade_date: string;
  quantity: number;
  price?: number;
  fees?: number;
  notes?: string | null;
}
