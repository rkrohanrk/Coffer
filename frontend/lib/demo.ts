// Frontend demo data for the seeded demo login (investor@coffer.in).
//
// These are the "original numbers" — the portfolio the backend computes (FIFO
// cost basis + current prices) from backend/supabase/seed.sql. Baked in here so
// the demo dashboard is populated without a running backend or database. Only
// used when the signed-in user is DEMO_EMAIL; real users always hit the API.

import type {
  AllocationRead,
  PerformanceRead,
  PortfolioSummary,
  Transaction,
} from "./types";

export const DEMO_EMAIL = "investor@coffer.in";

const PRICE_DATE = "2026-06-15";
const ACC_ZERODHA = "demo-acct-zerodha";
const ACC_GROWW = "demo-acct-groww";

export const DEMO_SUMMARY: PortfolioSummary = {
  total_market_value: 224340,
  total_cost_basis: 181615.83,
  total_unrealized_pnl: 42724.17,
  total_unrealized_pnl_pct: 23.52,
  total_realized_pnl: 3995.84,
  total_cash: 172515,
  price_stale: false,
  as_of: PRICE_DATE,
  holdings: [
    {
      account_id: ACC_ZERODHA, account_name: "Zerodha",
      asset_id: "demo-reliance", symbol: "RELIANCE.NS", name: "Reliance Industries Ltd",
      asset_class: "EQUITY", sector: "Energy",
      quantity: 20, avg_cost_per_share: 2653.75, cost_basis: 53075, realized_pnl: 0,
      current_price: 2980, market_value: 59600, unrealized_pnl: 6525, unrealized_pnl_pct: 12.29,
      price_date: PRICE_DATE, price_is_stale: false,
    },
    {
      account_id: ACC_GROWW, account_name: "Groww MF",
      asset_id: "demo-niftybees", symbol: "NIFTYBEES.NS", name: "Nippon India ETF Nifty BeES",
      asset_class: "ETF", sector: null,
      quantity: 150, avg_cost_per_share: 198, cost_basis: 29700, realized_pnl: 0,
      current_price: 288, market_value: 43200, unrealized_pnl: 13500, unrealized_pnl_pct: 45.45,
      price_date: PRICE_DATE, price_is_stale: false,
    },
    {
      account_id: ACC_ZERODHA, account_name: "Zerodha",
      asset_id: "demo-infy", symbol: "INFY.NS", name: "Infosys Ltd",
      asset_class: "EQUITY", sector: "Technology",
      quantity: 20, avg_cost_per_share: 1631.88, cost_basis: 32637.5, realized_pnl: 2762.5,
      current_price: 1875, market_value: 37500, unrealized_pnl: 4862.5, unrealized_pnl_pct: 14.9,
      price_date: PRICE_DATE, price_is_stale: false,
    },
    {
      account_id: ACC_GROWW, account_name: "Groww MF",
      asset_id: "demo-goldbees-g", symbol: "GOLDBEES.NS", name: "Nippon India ETF Gold BeES",
      asset_class: "ETF", sector: null,
      quantity: 50, avg_cost_per_share: 530, cost_basis: 26500, realized_pnl: 0,
      current_price: 640, market_value: 32000, unrealized_pnl: 5500, unrealized_pnl_pct: 20.75,
      price_date: PRICE_DATE, price_is_stale: false,
    },
    {
      account_id: ACC_ZERODHA, account_name: "Zerodha",
      asset_id: "demo-niftybees-z", symbol: "NIFTYBEES.NS", name: "Nippon India ETF Nifty BeES",
      asset_class: "ETF", sector: null,
      quantity: 80, avg_cost_per_share: 199.75, cost_basis: 15980, realized_pnl: 0,
      current_price: 288, market_value: 23040, unrealized_pnl: 7060, unrealized_pnl_pct: 44.18,
      price_date: PRICE_DATE, price_is_stale: false,
    },
    {
      account_id: ACC_ZERODHA, account_name: "Zerodha",
      asset_id: "demo-goldbees-z", symbol: "GOLDBEES.NS", name: "Nippon India ETF Gold BeES",
      asset_class: "ETF", sector: null,
      quantity: 30, avg_cost_per_share: 520.5, cost_basis: 15615, realized_pnl: 0,
      current_price: 640, market_value: 19200, unrealized_pnl: 3585, unrealized_pnl_pct: 22.96,
      price_date: PRICE_DATE, price_is_stale: false,
    },
    {
      account_id: ACC_ZERODHA, account_name: "Zerodha",
      asset_id: "demo-hdfcbank", symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd",
      asset_class: "EQUITY", sector: "Finance",
      quantity: 5, avg_cost_per_share: 1621.67, cost_basis: 8108.33, realized_pnl: 1233.34,
      current_price: 1960, market_value: 9800, unrealized_pnl: 1691.67, unrealized_pnl_pct: 20.86,
      price_date: PRICE_DATE, price_is_stale: false,
    },
  ],
};

export const DEMO_PERFORMANCE: PerformanceRead = {
  returns: [
    { period: "1M", twr: 0.021, xirr: null },
    { period: "6M", twr: 0.089, xirr: null },
    { period: "1Y", twr: 0.156, xirr: null },
    { period: "ALL", twr: 0.235, xirr: 0.187 },
  ],
};

export const DEMO_ALLOCATION: AllocationRead = {
  group_by: "sector",
  total_market_value: 224340,
  items: [
    { label: "Index ETF", market_value: 66240, weight: 29.53 },
    { label: "Energy", market_value: 59600, weight: 26.57 },
    { label: "Gold ETF", market_value: 51200, weight: 22.82 },
    { label: "Technology", market_value: 37500, weight: 16.72 },
    { label: "Finance", market_value: 9800, weight: 4.37 },
  ],
};

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: "demo-tx-1", account_id: ACC_ZERODHA, asset_id: "demo-hdfcbank", type: "SELL",
    trade_date: "2024-06-01", quantity: 5, price: 1780, fees: 25, notes: null,
    created_at: "2024-06-01T10:00:00Z", symbol: "HDFCBANK.NS", account_name: "Zerodha",
  },
  {
    id: "demo-tx-2", account_id: ACC_ZERODHA, asset_id: "demo-reliance", type: "BUY",
    trade_date: "2024-03-10", quantity: 5, price: 2950, fees: 25, notes: null,
    created_at: "2024-03-10T10:00:00Z", symbol: "RELIANCE.NS", account_name: "Zerodha",
  },
  {
    id: "demo-tx-3", account_id: ACC_ZERODHA, asset_id: "demo-hdfcbank", type: "SELL",
    trade_date: "2024-03-01", quantity: 5, price: 1720, fees: 25, notes: null,
    created_at: "2024-03-01T10:00:00Z", symbol: "HDFCBANK.NS", account_name: "Zerodha",
  },
  {
    id: "demo-tx-4", account_id: ACC_ZERODHA, asset_id: "demo-infy", type: "BUY",
    trade_date: "2024-02-01", quantity: 10, price: 1740, fees: 25, notes: null,
    created_at: "2024-02-01T10:00:00Z", symbol: "INFY.NS", account_name: "Zerodha",
  },
  {
    id: "demo-tx-5", account_id: ACC_GROWW, asset_id: "demo-niftybees", type: "BUY",
    trade_date: "2024-01-22", quantity: 50, price: 218, fees: 0, notes: null,
    created_at: "2024-01-22T10:00:00Z", symbol: "NIFTYBEES.NS", account_name: "Groww MF",
  },
  {
    id: "demo-tx-6", account_id: ACC_GROWW, asset_id: null, type: "DEPOSIT",
    trade_date: "2024-01-15", quantity: 50000, price: 1, fees: 0, notes: null,
    created_at: "2024-01-15T10:00:00Z", symbol: null, account_name: "Groww MF",
  },
];
