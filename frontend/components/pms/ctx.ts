import type { Account, Asset, PeriodReturn, Transaction } from "@/lib/types";
import type { DonutSegment } from "./primitives";

export interface Row {
  sym: string;
  name: string;
  sector: string | null;
  assetId: string;
  accountId: string;
  qty: number;
  avg: number;
  price: number;
  value: number;
  invested: number;
  pnl: number;
  pnlPct: number;
  allocPct: number;
  priceStale: boolean;
  priceDate: string | null;
}

export interface WatchRow {
  sym: string;
  name: string;
  sector: string | null;
  price: number | null;
  series: number[];
  up: boolean;
}

export interface Mover {
  sym: string;
  sector: string | null;
  price: number;
  pnlPct: number;
}

export interface Totals {
  holdingsValue: number;
  invested: number;
  pnl: number;
  pnlPct: number;
  realized: number;
  cash: number;
  netWorth: number;
}

export interface TradeTarget {
  sym: string;
  side: "BUY" | "SELL";
}

export interface DashCtx {
  loading: boolean;
  error: string | null;
  rows: Row[];
  totals: Totals;
  sectorSegments: DonutSegment[];
  movers: Mover[];
  watchRows: WatchRow[];
  orders: Transaction[];
  ordersTotal: number;
  assets: Asset[];
  accounts: Account[];
  watchlist: string[];
  navData: number[];
  range: string;
  setRange: (r: string) => void;
  returnForRange: PeriodReturn | null;
  priceStale: boolean;
  asOf: string;
  // actions
  go: (tab: string) => void;
  openTrade: (sym: string, side: "BUY" | "SELL") => void;
  addWatch: (sym: string) => void;
  removeWatch: (sym: string) => void;
}
