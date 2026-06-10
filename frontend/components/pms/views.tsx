"use client";
import { useState } from "react";

import { fmt, pct, rupee, rupeeCompact, rupeeSigned } from "@/lib/format";
import { sectorColor } from "@/lib/sectors";
import type { DashCtx, Row } from "./ctx";
import { RANGES } from "./useDashboard";
import { Delta, Donut, NavChart, Sparkline, Stat, Tk } from "./primitives";

function ltp(price: number) {
  return price > 0 ? fmt(price) : "—";
}

/* ---------------- Overview ---------------- */
export function Overview({ ctx }: { ctx: DashCtx }) {
  const { totals, rows, sectorSegments, movers, navData, range, setRange, go, openTrade, returnForRange } = ctx;
  const top = [...rows].sort((a, b) => b.value - a.value).slice(0, 6);

  const twr = returnForRange?.twr;
  const xirr = returnForRange?.xirr;

  return (
    <div className="grid" style={{ gap: "clamp(12px,1.4vw,18px)" }}>
      <div className="grid g-stats">
        <Stat
          k="Portfolio Value"
          value={rupeeCompact(totals.netWorth)}
          deltaPct={totals.invested ? totals.pnlPct : null}
          deltaMoney={totals.invested ? totals.pnl : null}
          sub="Holdings + cash · INR"
        />
        <Stat
          k="Invested"
          value={rupeeCompact(totals.invested)}
          sub={`Across ${rows.length} instrument${rows.length === 1 ? "" : "s"}`}
        />
        <Stat k="Unrealized P&L" value={rupeeSigned(totals.pnl, 0)} deltaPct={totals.pnlPct} />
        <Stat k="Available Cash" value={rupeeCompact(totals.cash)} sub="Settled funds · INR" />
      </div>

      <div className="grid g-main">
        <div className="grid" style={{ gap: "clamp(12px,1.4vw,18px)" }}>
          <div className="panel">
            <div className="panel-h">
              <div>
                <h3>Portfolio Performance</h3>
              </div>
              <div className="range-seg">
                {RANGES.map(([lbl]) => (
                  <button key={lbl} className={range === lbl ? "on" : ""} onClick={() => setRange(lbl)}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div className="panel-b">
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 6, flexWrap: "wrap" }}>
                <div className="v num" style={{ fontWeight: 600, fontSize: "1.7rem", letterSpacing: "-0.02em" }}>
                  {rupee(totals.holdingsValue, 0)}
                </div>
                <Delta pctVal={totals.pnlPct} money={totals.pnl} />
                <span className="num" style={{ color: "var(--faint)", fontSize: "0.7rem" }}>
                  holdings value
                </span>
              </div>
              <NavChart data={navData} />
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  marginTop: 14,
                  flexWrap: "wrap",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                }}
              >
                <span style={{ color: "var(--faint)" }}>
                  {range} TWR{" "}
                  <b className={(twr ?? 0) >= 0 ? "up" : "down"} style={{ marginLeft: 6 }}>
                    {twr != null ? pct(twr * 100) : "—"}
                  </b>
                </span>
                <span style={{ color: "var(--faint)" }}>
                  {range} XIRR{" "}
                  <b className={(xirr ?? 0) >= 0 ? "up" : "down"} style={{ marginLeft: 6 }}>
                    {xirr != null ? pct(xirr * 100) : "—"}
                  </b>
                </span>
                <span style={{ color: "var(--faint)", marginLeft: "auto" }}>curve indicative</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>Top Holdings</h3>
              <button className="lbl" style={{ cursor: "pointer" }} onClick={() => go("holdings")}>
                View all →
              </button>
            </div>
            <div className="panel-b flush">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Instrument</th>
                    <th className="hide-sm">LTP</th>
                    <th>Value</th>
                    <th>P&amp;L</th>
                    <th>Alloc</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((r) => (
                    <tr key={r.sym} style={{ cursor: "pointer" }} onClick={() => openTrade(r.sym, "BUY")}>
                      <td>
                        <div className="sym-cell">
                          <Tk sym={r.sym} sector={r.sector} size={32} />
                          <div className="nm">
                            <b>{r.sym}</b>
                            <small>{r.name}</small>
                          </div>
                        </div>
                      </td>
                      <td className="hide-sm num">{ltp(r.price)}</td>
                      <td className="num">{r.value > 0 ? rupee(r.value, 0) : "—"}</td>
                      <td className="num">
                        <span className={r.pnl >= 0 ? "up" : "down"}>{rupeeSigned(r.pnl, 0)}</span>
                      </td>
                      <td>
                        <div className="alloc-cell">
                          <div className="alloc-bar">
                            <i style={{ width: Math.min(100, r.allocPct) + "%", background: sectorColor(r.sector) }} />
                          </div>
                          <span className="num" style={{ fontSize: "0.74rem", minWidth: 38, textAlign: "right" }}>
                            {r.allocPct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {top.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty">No holdings yet — place an order to get started.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid" style={{ gap: "clamp(12px,1.4vw,18px)" }}>
          <div className="panel">
            <div className="panel-h">
              <h3>Allocation</h3>
              <span className="lbl">by sector</span>
            </div>
            <div className="panel-b">
              <div className="donut-wrap">
                <Donut segments={sectorSegments} centerTop={sectorSegments.length} centerBot="sectors" />
                <div className="legend">
                  {sectorSegments.map((s) => (
                    <div className="row" key={s.name}>
                      <span className="sw" style={{ background: s.color }} />
                      <span className="nm">{s.name}</span>
                      <span className="pc num">{s.pct.toFixed(1)}%</span>
                    </div>
                  ))}
                  {sectorSegments.length === 0 && <div className="empty">No allocation yet</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-h">
              <h3>Top Movers</h3>
              <span className="lbl">by unrealized P&amp;L</span>
            </div>
            <div className="panel-b flush">
              {movers.map((m) => (
                <div className="mover" key={m.sym}>
                  <Tk sym={m.sym} sector={m.sector} size={30} />
                  <div className="nm">
                    <b>{m.sym}</b>
                    <small>{m.sector ?? "—"}</small>
                  </div>
                  <div className="px">
                    <div className="p num">{ltp(m.price)}</div>
                    <div className={"c num " + (m.pnlPct >= 0 ? "up" : "down")}>{pct(m.pnlPct)}</div>
                  </div>
                </div>
              ))}
              {movers.length === 0 && <div className="empty">No positions to rank yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Holdings ---------------- */
type SortKey = keyof Pick<Row, "sym" | "qty" | "avg" | "price" | "value" | "pnl" | "pnlPct" | "allocPct">;

export function Holdings({ ctx }: { ctx: DashCtx }) {
  const { rows, totals, openTrade } = ctx;
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ k: SortKey; d: number }>({ k: "value", d: -1 });
  const cols: Array<[SortKey, string]> = [
    ["sym", "Instrument"],
    ["qty", "Qty"],
    ["avg", "Avg Cost"],
    ["price", "LTP"],
    ["value", "Cur. Value"],
    ["pnl", "P&L"],
    ["pnlPct", "Net %"],
    ["allocPct", "Alloc"],
  ];
  function th(k: SortKey) {
    setSort((s) => ({ k, d: s.k === k ? -s.d : -1 }));
  }
  let view = rows.filter(
    (r) => !q || r.sym.includes(q.toUpperCase()) || r.name.toLowerCase().includes(q.toLowerCase()),
  );
  view = [...view].sort((a, b) => {
    const av = a[sort.k];
    const bv = b[sort.k];
    if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * sort.d;
    return ((av as number) - (bv as number)) * sort.d;
  });

  return (
    <div className="panel">
      <div className="panel-h">
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <h3>Holdings</h3>
          <span className="lbl num">
            {rows.length} instruments · {rupee(totals.holdingsValue, 0)}
          </span>
        </div>
        <div className="search" style={{ width: "min(240px, 40vw)" }}>
          <span className="ic">⌕</span>
          <input placeholder="Search instrument" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="panel-b flush" style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              {cols.map(([k, lbl]) => (
                <th key={k} className="sortable" onClick={() => th(k)}>
                  {lbl}
                  {sort.k === k && <span className="ar"> {sort.d < 0 ? "↓" : "↑"}</span>}
                </th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.sym}>
                <td>
                  <div className="sym-cell">
                    <Tk sym={r.sym} sector={r.sector} />
                    <div className="nm">
                      <b>{r.sym}</b>
                      <small>{r.name}</small>
                    </div>
                  </div>
                </td>
                <td className="num">{fmt(r.qty, r.qty % 1 === 0 ? 0 : 2)}</td>
                <td className="num">{fmt(r.avg)}</td>
                <td className="num">
                  {ltp(r.price)}
                  {r.priceStale && r.price > 0 && (
                    <span title="Stale price" style={{ color: "var(--down)", marginLeft: 4 }}>
                      ·
                    </span>
                  )}
                </td>
                <td className="num">{r.value > 0 ? rupee(r.value, 0) : "—"}</td>
                <td className="num">
                  <span className={r.pnl >= 0 ? "up" : "down"}>{rupeeSigned(r.pnl, 0)}</span>
                </td>
                <td className="num">
                  <span className={r.pnl >= 0 ? "up" : "down"}>{pct(r.pnlPct)}</span>
                </td>
                <td>
                  <div className="alloc-cell">
                    <div className="alloc-bar">
                      <i style={{ width: Math.min(100, r.allocPct) + "%", background: sectorColor(r.sector) }} />
                    </div>
                    <span className="num" style={{ fontSize: "0.74rem", minWidth: 38, textAlign: "right" }}>
                      {r.allocPct.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td>
                  <div className="act">
                    <button className="mini-btn buy" onClick={() => openTrade(r.sym, "BUY")}>
                      Buy
                    </button>
                    <button className="mini-btn sell" onClick={() => openTrade(r.sym, "SELL")}>
                      Sell
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {view.length === 0 && (
          <div className="empty">{q ? `No instruments match "${q}"` : "No holdings yet"}</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Watchlist ---------------- */
export function Watchlist({ ctx }: { ctx: DashCtx }) {
  const { watchRows, assets, watchlist, addWatch, removeWatch, openTrade } = ctx;
  const [q, setQ] = useState("");
  const available = assets.filter(
    (s) =>
      !watchlist.includes(s.symbol) &&
      q &&
      (s.symbol.includes(q.toUpperCase()) || s.name.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="grid g-main">
      <div className="panel">
        <div className="panel-h">
          <h3>Watchlist</h3>
          <span className="lbl">{watchlist.length} tracked</span>
        </div>
        <div className="panel-b flush" style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Instrument</th>
                <th className="hide-sm">Trend</th>
                <th>LTP</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {watchRows.map((r) => (
                <tr key={r.sym}>
                  <td>
                    <div className="sym-cell">
                      <Tk sym={r.sym} sector={r.sector} />
                      <div className="nm">
                        <b>{r.sym}</b>
                        <small>{r.name}</small>
                      </div>
                    </div>
                  </td>
                  <td className="hide-sm" style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-block" }}>
                      <Sparkline data={r.series} up={r.up} />
                    </div>
                  </td>
                  <td className="num">{r.price != null ? fmt(r.price) : "—"}</td>
                  <td>
                    <div className="act">
                      <button className="mini-btn buy" onClick={() => openTrade(r.sym, "BUY")}>
                        Buy
                      </button>
                      <button className="mini-btn" onClick={() => removeWatch(r.sym)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {watchRows.length === 0 && <div className="empty">Watchlist empty — add instruments →</div>}
        </div>
      </div>

      <div className="panel" style={{ alignSelf: "start" }}>
        <div className="panel-h">
          <h3>Add Instrument</h3>
          <span className="lbl">NSE universe</span>
        </div>
        <div className="panel-b">
          <div className="search" style={{ marginBottom: 14 }}>
            <span className="ic">⌕</span>
            <input placeholder="Search instruments" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="grid" style={{ gap: 8 }}>
            {available.slice(0, 8).map((s) => (
              <div className="mover" key={s.symbol} style={{ borderBottom: "1px solid var(--line)", padding: "10px 4px" }}>
                <Tk sym={s.symbol} sector={s.sector} size={30} />
                <div className="nm">
                  <b>{s.symbol}</b>
                  <small>{s.sector ?? s.asset_class}</small>
                </div>
                <button className="mini-btn buy" style={{ marginLeft: "auto" }} onClick={() => addWatch(s.symbol)}>
                  + Add
                </button>
              </div>
            ))}
            {!q && <div className="empty" style={{ padding: "30px 10px" }}>Type to search the instrument universe</div>}
            {q && available.length === 0 && (
              <div className="empty" style={{ padding: "30px 10px" }}>
                No matches / already tracked
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Orders (transaction ledger) ---------------- */
export function Orders({ ctx }: { ctx: DashCtx }) {
  const { orders, ordersTotal } = ctx;
  return (
    <div className="panel">
      <div className="panel-h">
        <h3>Order History</h3>
        <span className="lbl">{ordersTotal} transactions</span>
      </div>
      <div className="panel-b flush" style={{ overflowX: "auto" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Instrument</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const buyish = o.type === "BUY" || o.type === "DEPOSIT" || o.type === "DIVIDEND";
              return (
                <tr key={o.id}>
                  <td style={{ textAlign: "left" }} className="num">
                    {o.trade_date}
                  </td>
                  <td style={{ textAlign: "left" }}>
                    <span
                      className={"chip " + (buyish ? "chip-up" : "chip-down")}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.1em",
                        padding: "3px 9px",
                        borderRadius: 5,
                      }}
                    >
                      {o.type}
                    </span>
                  </td>
                  <td style={{ textAlign: "left" }}>
                    {o.symbol ? (
                      <div className="sym-cell">
                        <Tk sym={o.symbol} sector={null} size={30} />
                        <div className="nm">
                          <b>{o.symbol}</b>
                          <small>{o.account_name ?? ""}</small>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>Cash · {o.account_name ?? ""}</span>
                    )}
                  </td>
                  <td className="num">{o.symbol ? fmt(o.quantity, o.quantity % 1 === 0 ? 0 : 2) : "—"}</td>
                  <td className="num">{o.symbol ? fmt(o.price) : "—"}</td>
                  <td className="num">
                    {o.symbol ? rupee(o.quantity * o.price, 0) : rupee(o.quantity, 0)}
                  </td>
                  <td>
                    <span className="num" style={{ color: "var(--up)", fontSize: "0.7rem" }}>
                      ● Executed
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="empty">No transactions yet — buy or sell an instrument to see it here.</div>
        )}
      </div>
    </div>
  );
}
