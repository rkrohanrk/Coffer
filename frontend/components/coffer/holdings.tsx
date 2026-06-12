"use client";
import { fmt, pct, rupeeCompact } from "@/lib/format";
import { genSeries } from "@/lib/sectors";
import { Spark } from "./primitives";

export type HoldingRow = {
  sym: string;
  name: string;
  qty: number;
  price: number;
  pnl: number;
};

export function CofHoldings({
  rows, totalPnl, totalPnlPct, delay = 140,
}: {
  rows: HoldingRow[]; totalPnl: number; totalPnlPct: number; delay?: number;
}) {
  return (
    <div className="card rise" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div className="lbl">Holdings · {rows.length} {rows.length === 1 ? "equity" : "equities"}</div>
        {rows.length > 0 && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--b-mut)", whiteSpace: "nowrap" }}>
            Total P&amp;L{" "}
            <b style={{ color: totalPnl >= 0 ? "var(--acc)" : "var(--b-down)" }}>
              {totalPnl >= 0 ? "+" : "−"}{rupeeCompact(Math.abs(totalPnl))}
            </b>{" "}
            ({pct(totalPnlPct)})
          </span>
        )}
      </div>
      {rows.length === 0 ? (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--b-faint)", padding: "24px 0" }}>
          No holdings yet
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="lbl" style={{ fontSize: 9 }}>Symbol</th>
              <th className="lbl" style={{ fontSize: 9 }}>Qty</th>
              <th className="lbl" style={{ fontSize: 9 }}>LTP</th>
              <th className="lbl" style={{ fontSize: 9 }}>Day</th>
              <th className="lbl" style={{ fontSize: 9 }}>P&amp;L</th>
              <th className="lbl" style={{ fontSize: 9 }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h, i) => {
              const spark = genSeries(h.sym.length * 7 + h.sym.charCodeAt(0), 24, h.price || 100, 0.06);
              const sparkUp = spark[0] < spark[spark.length - 1];
              return (
                <tr key={h.sym}>
                  <td>
                    <span className="sym">{h.sym}</span>
                    <span className="sub2">{h.name}</span>
                  </td>
                  <td style={{ color: "var(--b-mut)" }}>{h.qty}</td>
                  <td>{fmt(h.price, 2)}</td>
                  <td><span className="fs-delta" style={{ color: "var(--b-faint)" }}>—</span></td>
                  <td style={{ color: h.pnl >= 0 ? "var(--b-up)" : "var(--b-down)" }}>
                    {h.pnl >= 0 ? "+" : "−"}{rupeeCompact(Math.abs(h.pnl))}
                  </td>
                  <td style={{ paddingLeft: 18 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Spark data={spark} color={sparkUp ? "var(--b-up)" : "var(--b-down)"} delay={500 + i * 90} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
