"use client";
import { useState, type CSSProperties } from "react";

import { rupee } from "@/lib/format";

type Vars = CSSProperties & Record<string, string>;

/* Deterministic pseudo-random P&L so month navigation is stable.
   Indicative only — the backend has no historical daily P&L feed,
   matching the genNav/genSeries placeholder convention used elsewhere. */
function cofHash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function cofDayPnl(y: number, m: number, d: number): number | null {
  const dow = new Date(y, m, d).getDay();
  if (dow === 0 || dow === 6) return null;
  const seed = y * 372 + m * 31 + d;
  const win = cofHash(seed) < 0.63;
  const mag = Math.round((1800 + cofHash(seed + 0.5) * 36000) / 100) * 100;
  return win ? mag : -mag;
}

const COF_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const COF_DOW = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export function PnlCalendar({ delay = 0 }: { delay?: number }) {
  const today = new Date();
  const TODAY = { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };
  const [ym, setYm] = useState({ y: TODAY.y, m: TODAY.m });

  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
  const firstDow = new Date(ym.y, ym.m, 1).getDay();
  const atCurrent = ym.y === TODAY.y && ym.m === TODAY.m;

  const isFuture = (y: number, m: number, d: number) =>
    y > TODAY.y || (y === TODAY.y && (m > TODAY.m || (m === TODAY.m && d > TODAY.d)));

  const step = (dir: number) => {
    setYm(({ y, m }) => {
      let nm = m + dir, ny = y;
      if (nm < 0) { nm = 11; ny--; }
      if (nm > 11) { nm = 0; ny++; }
      return { y: ny, m: nm };
    });
  };

  type Cell = { pad?: boolean; key: string; d?: number; pnl?: number | null; future?: boolean; today?: boolean };
  const cells: Cell[] = [];
  let total = 0, wins = 0, losses = 0;
  for (let i = 0; i < firstDow; i++) cells.push({ pad: true, key: "p" + i });
  for (let d = 1; d <= daysIn; d++) {
    const future = isFuture(ym.y, ym.m, d);
    const pnl = future ? undefined : cofDayPnl(ym.y, ym.m, d);
    if (pnl != null && !future) { total += pnl; pnl >= 0 ? wins++ : losses++; }
    cells.push({ d, pnl, future, key: "d" + d, today: atCurrent && d === TODAY.d });
  }

  const maxMag = 38000;
  const cellStyle = (c: Cell): Vars => {
    if (c.pad || c.future || c.pnl == null) return {};
    const t = Math.min(1, Math.abs(c.pnl) / maxMag);
    const pct = Math.round(26 + t * 40); // 26% – 66% tint: clearly green/red by magnitude
    const col = c.pnl >= 0 ? "var(--acc)" : "var(--b-down)";
    return { "--cell-bg": `color-mix(in srgb, ${col} ${pct}%, transparent)` };
  };

  return (
    <div className="card rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="cof-cal-head">
        <div className="lbl">Daily P&amp;L</div>
        <div className="cof-cal-nav">
          <button type="button" onClick={() => step(-1)} aria-label="Previous month">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 5 L7.5 12 L14.5 19" /></svg>
          </button>
          <b>{COF_MONTHS[ym.m]} {ym.y}</b>
          <button type="button" onClick={() => step(1)} disabled={atCurrent} aria-label="Next month">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 5 L16.5 12 L9.5 19" /></svg>
          </button>
        </div>
      </div>

      <div className="cof-cal-dow">
        {COF_DOW.map((w) => <span key={w}>{w}</span>)}
      </div>
      <div className="cof-cal-grid">
        {cells.map((c) => {
          if (c.pad) return <div key={c.key} className="cof-cal-cell pad" />;
          const cls = c.future ? "future" : c.pnl == null ? "off" : c.pnl >= 0 ? "gain" : "loss";
          return (
            <div key={c.key} className={`cof-cal-cell ${cls} ${c.today ? "today" : ""}`} style={cellStyle(c)}
              title={c.pnl != null && !c.future ? `${c.pnl >= 0 ? "+" : "−"}${rupee(Math.abs(c.pnl), 0)}` : undefined}>
              <span className="d">{c.d}</span>
            </div>
          );
        })}
      </div>

      <div className="cof-cal-foot">
        <div>
          <div className="lbl" style={{ fontSize: 9, marginBottom: 4 }}>{COF_MONTHS[ym.m]} net</div>
          <div className="tot" style={{ color: total >= 0 ? "var(--acc)" : "var(--b-down)" }}>
            {total >= 0 ? "+" : "−"}{rupee(Math.abs(total), 0)}
          </div>
        </div>
        <div className="wl"><b className="w">{wins}W</b> / <b className="l">{losses}L</b> · {wins + losses} sessions</div>
      </div>
    </div>
  );
}
