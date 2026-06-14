"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "./api";
import type {
  Account,
  Asset,
  AllocationRead,
  PerformanceRead,
  PortfolioSummary,
  Transaction,
  TransactionCreate,
  TransactionPage,
} from "./types";

export const keys = {
  accounts: ["accounts"] as const,
  assets: ["assets"] as const,
  holdings: ["holdings"] as const,
  performance: ["performance"] as const,
  allocation: (group: string) => ["allocation", group] as const,
  transactions: (params?: Record<string, unknown>) =>
    ["transactions", params ?? {}] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: keys.accounts,
    queryFn: () => apiFetch<Account[]>("/accounts"),
    staleTime: 5 * 60_000,
  });
}

export function useAssets() {
  return useQuery({
    queryKey: keys.assets,
    queryFn: () => apiFetch<Asset[]>("/assets"),
    staleTime: 5 * 60_000,
  });
}

export function useHoldings() {
  return useQuery({
    queryKey: keys.holdings,
    queryFn: () => apiFetch<PortfolioSummary>("/holdings"),
  });
}

export function usePerformance() {
  return useQuery({
    queryKey: keys.performance,
    queryFn: () => apiFetch<PerformanceRead>("/performance"),
    staleTime: 5 * 60_000,
  });
}

export function useAllocation(groupBy: "sector" | "asset_class" = "sector") {
  return useQuery({
    queryKey: keys.allocation(groupBy),
    queryFn: () =>
      apiFetch<AllocationRead>(`/allocation?group_by=${groupBy}`),
  });
}

export function useTransactions(params?: { page?: number; size?: number }) {
  const page = params?.page ?? 1;
  const size = params?.size ?? 50;
  return useQuery({
    queryKey: keys.transactions({ page, size }),
    queryFn: () =>
      apiFetch<TransactionPage>(`/transactions?page=${page}&size=${size}`),
  });
}

// Invalidate everything that a trade can move: holdings, performance,
// allocation and the transaction ledger.
function invalidatePortfolio(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: keys.holdings });
  qc.invalidateQueries({ queryKey: keys.performance });
  qc.invalidateQueries({ queryKey: ["allocation"] });
  qc.invalidateQueries({ queryKey: ["transactions"] });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TransactionCreate) =>
      apiFetch<Transaction>("/transactions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => invalidatePortfolio(qc),
  });
}

export function useRefreshPrices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ total: number; ok: number; errors: Record<string, string> }>(
        "/prices/refresh",
        { method: "POST" },
      ),
    onSuccess: () => invalidatePortfolio(qc),
  });
}
