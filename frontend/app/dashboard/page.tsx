"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CofActivity } from "@/components/coffer/activity";
import { CofAllocation } from "@/components/coffer/alloc";
import { PnlCalendar } from "@/components/coffer/calendar";
import { CofHero } from "@/components/coffer/hero";
import { CofHoldings, type HoldingRow } from "@/components/coffer/holdings";
import { Delta } from "@/components/coffer/primitives";
import { CofRail, useEdgeDrawer } from "@/components/coffer/rail";
import { signOut, useUser } from "@/lib/auth";
import {
  DEMO_ALLOCATION,
  DEMO_EMAIL,
  DEMO_PERFORMANCE,
  DEMO_SUMMARY,
  DEMO_TRANSACTIONS,
} from "@/lib/demo";
import { rupeeCompact } from "@/lib/format";
import { useAllocation, useHoldings, usePerformance, useTransactions } from "@/lib/queries";
import { INDICES } from "@/lib/sectors";

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// NSE cash session: Mon–Fri, 09:15–15:30 local time.
function marketStatus(d: Date) {
  const mins = d.getHours() * 60 + d.getMinutes();
  const open = d.getDay() >= 1 && d.getDay() <= 5 && mins >= 555 && mins <= 930;
  return open ? "OPEN" : "CLOSED";
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const holdingsQ = useHoldings();
  const perfQ = usePerformance();
  const allocQ = useAllocation("sector");
  const txQ = useTransactions({ page: 1, size: 6 });

  // The seeded demo user gets a baked-in portfolio so the dashboard is populated
  // without a backend. Real users always use the live API responses.
  const isDemo = (user?.email ?? "").trim().toLowerCase() === DEMO_EMAIL;

  const [pinned, setPinned] = useState(false);
  const hoverOpen = useEdgeDrawer(10);
  const open = hoverOpen || pinned;

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login");
  }, [userLoading, user, router]);

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  // Arms the entrance animations defined in coffer-dash.css, then drops the
  // gate so base styles win even if the tab was backgrounded mid-animation.
  useEffect(() => {
    document.body.classList.add("anim");
    const id = setTimeout(() => document.body.classList.remove("anim"), 2600);
    return () => {
      clearTimeout(id);
      document.body.classList.remove("anim");
    };
  }, []);

  const summary = isDemo ? DEMO_SUMMARY : holdingsQ.data;

  const totals = useMemo(() => {
    if (!summary) return { invested: 0, pnl: 0, pnlPct: 0, cash: 0, netWorth: 0 };
    return {
      invested: summary.total_cost_basis,
      pnl: summary.total_unrealized_pnl,
      pnlPct: summary.total_unrealized_pnl_pct,
      cash: summary.total_cash,
      netWorth: summary.total_market_value + summary.total_cash,
    };
  }, [summary]);

  const rows = useMemo<HoldingRow[]>(() => {
    if (!summary) return [];
    return [...summary.holdings]
      .sort((a, b) => (b.market_value ?? 0) - (a.market_value ?? 0))
      .map((h) => ({
        sym: h.symbol,
        name: h.name,
        qty: h.quantity,
        price: h.current_price ?? 0,
        pnl: h.unrealized_pnl ?? 0,
      }));
  }, [summary]);

  const perf = isDemo ? DEMO_PERFORMANCE : perfQ.data;
  const xirr = useMemo(() => {
    const returns = perf?.returns ?? [];
    return returns.find((r) => r.period === "ALL")?.xirr ?? returns[0]?.xirr ?? null;
  }, [perf]);

  const alloc = isDemo ? DEMO_ALLOCATION : allocQ.data;
  const allocItems = alloc?.items ?? [];
  const allocTotal = alloc?.total_market_value ?? totals.netWorth;
  const recent = isDemo ? DEMO_TRANSACTIONS : (txQ.data?.items ?? []);

  const userName = user?.email?.split("@")[0] ?? "Investor";
  const userInitial = userName.charAt(0).toUpperCase();

  if (userLoading || !user) {
    return <div className="cof" style={{ minHeight: "100vh" }} />;
  }

  const now = new Date();

  return (
    <div className="cof">
      <div className={`cof-scrim ${open ? "on" : ""}`} />
      <div className={`cof-edge-hint ${open ? "" : "show"}`} />
      <CofRail
        open={open}
        active="dashboard"
        onTogglePin={() => setPinned((p) => !p)}
        onLogout={handleLogout}
        userInitial={userInitial}
        userName={userName}
        aum={`AUM ${rupeeCompact(totals.netWorth)}`}
      />

      <main className="cof-main" data-screen-label="Dashboard">
        <header className="cof-head rise">
          <div>
            <h1>Dashboard</h1>
            <div className="sub">
              {DOW[now.getDay()]} {now.getDate()} {MON[now.getMonth()]} {now.getFullYear()} · MARKET {marketStatus(now)}
            </div>
          </div>
          <div className="ticks">
            {INDICES.slice(0, 3).map((ix) => {
              const chg = ((ix.val - ix.pc) / ix.pc) * 100;
              return (
                <div className="tk" key={ix.sym}>
                  <b>{ix.sym}</b> {ix.val.toLocaleString("en-IN")} <Delta v={chg} />
                </div>
              );
            })}
          </div>
        </header>

        <div className="cof-grid">
          <div className="cof-col">
            <CofHero
              netWorth={totals.netWorth}
              invested={totals.invested}
              pnl={totals.pnl}
              pnlPct={totals.pnlPct}
              cash={totals.cash}
              xirr={xirr}
              delay={60}
            />
            <CofHoldings rows={rows} totalPnl={totals.pnl} totalPnlPct={totals.pnlPct} delay={140} />
            <CofAllocation items={allocItems} totalValue={allocTotal} delay={220} />
          </div>
          <div className="cof-col">
            <PnlCalendar delay={110} />
            <CofActivity items={recent} delay={210} />
          </div>
        </div>
      </main>
    </div>
  );
}
