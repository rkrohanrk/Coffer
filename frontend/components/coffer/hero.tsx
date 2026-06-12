"use client";
import { useState } from "react";

import { rupee, rupeeCompact } from "@/lib/format";
import { genNav } from "@/lib/sectors";
import { AreaChart, Delta, Num } from "./primitives";

const HERO_RANGES: Record<string, number> = { "1M": 22, "6M": 130, "1Y": 252, "ALL": 320 };
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function trendLabels(range: string): string[] {
  const spanMonths: Record<string, number> = { "1M": 1, "6M": 6, "1Y": 12, ALL: 24 };
  const span = spanMonths[range] ?? 6;
  const now = new Date();
  const out: string[] = [];
  const steps = 6;
  for (let i = steps - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - Math.round((span / (steps - 1)) * i), 1);
    out.push(MONTH_ABBR[d.getMonth()]);
  }
  return out;
}

export function CofHero({
  netWorth, invested, pnl, pnlPct, cash, xirr, delay = 60,
}: {
  netWorth: number; invested: number; pnl: number; pnlPct: number; cash: number; xirr: number | null; delay?: number;
}) {
  const [range, setRange] = useState("6M");
  const navData = genNav(netWorth || 1, HERO_RANGES[range] ?? 130);

  return (
    <div className="card rise" style={{ animationDelay: `${delay}ms`, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div className="lbl" style={{ marginBottom: 9 }}>Portfolio value</div>
          <div className="bignum"><span className="pre">₹</span><Num v={netWorth} /></div>
          <div style={{ display: "flex", gap: 12, marginTop: 10, alignItems: "center" }}>
            <Delta v={pnlPct} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--b-mut)" }}>
              {pnl >= 0 ? "+" : "−"}{rupee(Math.abs(pnl), 0)} unrealized P&amp;L
            </span>
          </div>
        </div>
        <div className="range">
          {["1M", "6M", "1Y", "ALL"].map((r) => (
            <button key={r} type="button" className={r === range ? "on" : ""} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>
      <div style={{ height: 158, color: "var(--b-mut)" }}>
        <AreaChart data={navData} w={760} h={158} delay={250} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {trendLabels(range).map((m, i) => (
          <span key={`${m}-${i}`} className="lbl" style={{ fontSize: 9, color: "var(--b-faint)" }}>{m}</span>
        ))}
      </div>
      <div className="stat-strip">
        <div className="st"><span className="lbl" style={{ fontSize: 9 }}>Invested</span><b>{rupeeCompact(invested)}</b></div>
        <div className="st">
          <span className="lbl" style={{ fontSize: 9 }}>Total P&amp;L</span>
          <b style={{ color: pnl >= 0 ? "var(--acc)" : "var(--b-down)" }}>{pnl >= 0 ? "+" : "−"}{rupeeCompact(Math.abs(pnl))}</b>
        </div>
        <div className="st"><span className="lbl" style={{ fontSize: 9 }}>XIRR</span><b>{xirr != null ? `${(xirr * 100).toFixed(1)}%` : "—"}</b></div>
        <div className="st"><span className="lbl" style={{ fontSize: 9 }}>Cash</span><b>{rupeeCompact(cash)}</b></div>
      </div>
    </div>
  );
}
