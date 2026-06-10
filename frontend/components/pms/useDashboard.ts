"use client";
import { useEffect, useMemo, useState } from "react";

import {
  useAccounts,
  useAllocation,
  useAssets,
  useHoldings,
  usePerformance,
  useTransactions,
} from "@/lib/queries";
import { genNav, genSeries, sectorColor } from "@/lib/sectors";
import type { DashCtx, Mover, Row, Totals, WatchRow } from "./ctx";

const WATCH_KEY = "coffer_watchlist_v1";

// chart point-count + the matching backend performance period
const RANGES: Array<[string, number]> = [
  ["1M", 22],
  ["3M", 66],
  ["YTD", 160],
  ["1Y", 252],
  ["ALL", 300],
];

export function useDashboard(
  setTab: (t: string) => void,
  openTrade: (sym: string, side: "BUY" | "SELL") => void,
): DashCtx {
  const holdingsQ = useHoldings();
  const perfQ = usePerformance();
  const allocQ = useAllocation("sector");
  const accountsQ = useAccounts();
  const assetsQ = useAssets();
  const txQ = useTransactions({ page: 1, size: 100 });

  const [range, setRange] = useState("3M");
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // watchlist is a client-side concern — the backend has no watchlist concept.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WATCH_KEY);
      if (raw) setWatchlist(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(WATCH_KEY, JSON.stringify(watchlist));
    } catch {
      /* ignore */
    }
  }, [watchlist]);

  const summary = holdingsQ.data;
  const assets = useMemo(() => assetsQ.data ?? [], [assetsQ.data]);
  const accounts = useMemo(() => accountsQ.data ?? [], [accountsQ.data]);

  const rows = useMemo<Row[]>(() => {
    if (!summary) return [];
    const totalVal = summary.total_market_value || 1;
    return summary.holdings.map((h) => {
      const value = h.market_value ?? 0;
      return {
        sym: h.symbol,
        name: h.name,
        sector: h.sector,
        assetId: h.asset_id,
        accountId: h.account_id,
        qty: h.quantity,
        avg: h.avg_cost_per_share,
        price: h.current_price ?? 0,
        value,
        invested: h.cost_basis,
        pnl: h.unrealized_pnl ?? 0,
        pnlPct: h.unrealized_pnl_pct ?? 0,
        allocPct: (value / totalVal) * 100,
        priceStale: h.price_is_stale,
        priceDate: h.price_date,
      };
    });
  }, [summary]);

  const totals = useMemo<Totals>(() => {
    if (!summary) {
      return {
        holdingsValue: 0,
        invested: 0,
        pnl: 0,
        pnlPct: 0,
        realized: 0,
        cash: 0,
        netWorth: 0,
      };
    }
    return {
      holdingsValue: summary.total_market_value,
      invested: summary.total_cost_basis,
      pnl: summary.total_unrealized_pnl,
      pnlPct: summary.total_unrealized_pnl_pct,
      realized: summary.total_realized_pnl,
      cash: summary.total_cash,
      netWorth: summary.total_market_value + summary.total_cash,
    };
  }, [summary]);

  const sectorSegments = useMemo(() => {
    const items = allocQ.data?.items ?? [];
    return items.map((it) => ({
      name: it.label,
      pct: it.weight,
      color: sectorColor(it.label),
    }));
  }, [allocQ.data]);

  // Backend serves end-of-day prices (no intraday/previous-close feed), so
  // "movers" surfaces the user's own positions ranked by unrealized return.
  const movers = useMemo<Mover[]>(
    () =>
      [...rows]
        .sort((a, b) => Math.abs(b.pnlPct) - Math.abs(a.pnlPct))
        .slice(0, 6)
        .map((r) => ({
          sym: r.sym,
          sector: r.sector,
          price: r.price,
          pnlPct: r.pnlPct,
        })),
    [rows],
  );

  const watchRows = useMemo<WatchRow[]>(() => {
    const assetMap = new Map(assets.map((a) => [a.symbol, a]));
    const priceMap = new Map(rows.map((r) => [r.sym, r]));
    return watchlist.map((sym) => {
      const a = assetMap.get(sym);
      const held = priceMap.get(sym);
      const price = held?.price ?? null;
      const up = (held?.pnlPct ?? 0) >= 0;
      return {
        sym,
        name: a?.name ?? sym,
        sector: a?.sector ?? null,
        price,
        up,
        series: genSeries(sym.length * 7 + sym.charCodeAt(0), 24, price ?? 100, 0.06),
      };
    });
  }, [watchlist, assets, rows]);

  const navData = useMemo(() => {
    const n = RANGES.find(([l]) => l === range)?.[1] ?? 66;
    return genNav(totals.holdingsValue + totals.cash, n);
  }, [range, totals.holdingsValue, totals.cash]);

  const returnForRange = useMemo(() => {
    return perfQ.data?.returns.find((r) => r.period === range) ?? null;
  }, [perfQ.data, range]);

  function addWatch(sym: string) {
    setWatchlist((w) => (w.includes(sym) ? w : [sym, ...w]));
  }
  function removeWatch(sym: string) {
    setWatchlist((w) => w.filter((x) => x !== sym));
  }

  const error =
    (holdingsQ.error as Error | null)?.message ??
    (accountsQ.error as Error | null)?.message ??
    null;

  return {
    loading: holdingsQ.isLoading,
    error,
    rows,
    totals,
    sectorSegments,
    movers,
    watchRows,
    orders: txQ.data?.items ?? [],
    ordersTotal: txQ.data?.total ?? 0,
    assets,
    accounts,
    watchlist,
    navData,
    range,
    setRange,
    returnForRange,
    priceStale: summary?.price_stale ?? false,
    asOf: summary?.as_of ?? "",
    go: setTab,
    openTrade,
    addWatch,
    removeWatch,
  };
}

export { RANGES };
