"use client";
import { rupeeCompact } from "@/lib/format";
import type { Transaction } from "@/lib/types";

const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const OUTFLOW = new Set(["BUY", "WITHDRAWAL"]);

export function CofActivity({ items, delay = 240 }: { items: Transaction[]; delay?: number }) {
  return (
    <div className="card rise" style={{ animationDelay: `${delay}ms` }}>
      <div className="lbl" style={{ marginBottom: 12 }}>Recent activity</div>
      {items.length === 0 ? (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--b-faint)", padding: "24px 0" }}>
          No transactions yet
        </div>
      ) : (
        <div className="recur">
          {items.map((tx) => {
            // Parse the "YYYY-MM-DD" date ourselves — `new Date(string)`
            // reads it as UTC and can shift the day in negative-offset zones.
            const [y, m, day] = tx.trade_date.slice(0, 10).split("-").map(Number);
            const out = OUTFLOW.has(tx.type);
            const isSplit = tx.type === "SPLIT";
            const amount = tx.quantity * tx.price;
            return (
              <div className="row" key={tx.id}>
                <div className="date">{day}</div>
                <div className="meta">
                  <b>{tx.type}{tx.symbol ? ` · ${tx.symbol}` : ""}</b>
                  <span>{tx.account_name ?? "—"} · {MONTH_ABBR[m - 1]} {y}</span>
                </div>
                <div className="amt" style={{ color: isSplit ? "var(--b-mut)" : out ? "var(--b-down)" : "var(--b-up)" }}>
                  {isSplit ? "—" : `${out ? "−" : "+"}${rupeeCompact(amount)}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
