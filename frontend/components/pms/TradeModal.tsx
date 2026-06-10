"use client";
import { useEffect, useMemo, useState } from "react";

import { fmt, rupee, rupeeCompact } from "@/lib/format";
import { useCreateTransaction } from "@/lib/queries";
import { useToast } from "@/lib/toast";
import type { DashCtx, TradeTarget } from "./ctx";
import { Tk } from "./primitives";

export function TradeModal({
  ctx,
  trade,
  onClose,
}: {
  ctx: DashCtx;
  trade: TradeTarget;
  onClose: () => void;
}) {
  const { rows, assets, accounts, totals } = ctx;
  const createTx = useCreateTransaction();
  const toast = useToast();

  const asset = assets.find((a) => a.symbol === trade.sym);
  const holding = rows.find((r) => r.sym === trade.sym);
  const held = holding?.qty ?? 0;
  const ltp = holding?.price ?? 0;
  const name = asset?.name ?? holding?.name ?? trade.sym;
  const sector = asset?.sector ?? holding?.sector ?? null;

  const [side, setSide] = useState<"BUY" | "SELL">(trade.side);
  const [qty, setQty] = useState<number>(trade.side === "SELL" ? Math.min(held || 1, 10) || 1 : 10);
  const [price, setPrice] = useState<number>(ltp || 0);
  const [accountId, setAccountId] = useState<string>(holding?.accountId ?? accounts[0]?.id ?? "");
  const [submitErr, setSubmitErr] = useState<string>("");

  useEffect(() => {
    setSide(trade.side);
    setQty(trade.side === "SELL" ? Math.min(held || 1, 10) || 1 : 10);
    setPrice(ltp || 0);
    setAccountId(holding?.accountId ?? accounts[0]?.id ?? "");
    setSubmitErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trade]);

  const amount = qty * price;
  const charges = Math.max(amount * 0.0003, 0);
  const total = side === "BUY" ? amount + charges : amount - charges;

  const hardErr = useMemo(() => {
    if (!asset) return "Instrument not in tradable universe";
    if (!accountId) return "No account available — create one first";
    if (!qty || qty <= 0) return "Enter a valid quantity";
    if (!price || price <= 0) return "Enter a valid price";
    if (side === "SELL" && qty > held) return `You only hold ${held} share${held === 1 ? "" : "s"}`;
    return "";
  }, [asset, accountId, qty, price, side, held]);

  const softWarn =
    side === "BUY" && total > totals.cash
      ? `Exceeds settled cash (${rupee(totals.cash, 0)}) — cash balance will go negative`
      : "";

  async function submit() {
    if (hardErr || !asset) return;
    setSubmitErr("");
    try {
      await createTx.mutateAsync({
        account_id: accountId,
        asset_id: asset.id,
        type: side,
        trade_date: new Date().toISOString().slice(0, 10),
        quantity: qty,
        price,
        fees: Math.round(charges * 100) / 100,
      });
      toast(`${side} ${qty} ${trade.sym} @ ₹${fmt(price)}`, side === "BUY" ? "up" : "down");
      onClose();
    } catch (e) {
      setSubmitErr((e as Error).message || "Order failed");
    }
  }

  return (
    <div
      className="modal-ov"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-h">
          <div className="side">
            <Tk sym={trade.sym} sector={sector} size={38} />
            <div>
              <h3>{trade.sym}</h3>
              <small>{name}</small>
            </div>
          </div>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-b">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div className="num" style={{ fontWeight: 600, fontSize: "1.5rem" }}>
              {ltp > 0 ? `₹${fmt(ltp)}` : "—"}
            </div>
            <div className="num" style={{ fontSize: "0.74rem", color: "var(--muted)" }}>
              Holding: {held} · Cash {rupeeCompact(totals.cash)}
            </div>
          </div>

          <div className="seg2">
            <button className={"buy " + (side === "BUY" ? "on" : "")} onClick={() => setSide("BUY")}>
              Buy
            </button>
            <button className={"sell " + (side === "SELL" ? "on" : "")} onClick={() => setSide("SELL")}>
              Sell
            </button>
          </div>

          {accounts.length > 1 && (
            <div className="field">
              <label>Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--bg)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  color: "var(--fg)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="qty-row">
            <div className="field">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(0, Math.floor(+e.target.value || 0)))}
              />
            </div>
            <div className="field">
              <label>Price (₹)</label>
              <input
                className="num"
                type="number"
                min="0"
                step="0.05"
                value={price}
                onChange={(e) => setPrice(Math.max(0, +e.target.value || 0))}
              />
            </div>
          </div>

          <div className="chips">
            {[5, 10, 25, 50].map((n) => (
              <button key={n} onClick={() => setQty(n)}>
                {n}
              </button>
            ))}
            {side === "SELL" && held > 0 && <button onClick={() => setQty(held)}>All ({held})</button>}
            {side === "BUY" && price > 0 && (
              <button onClick={() => setQty(Math.max(1, Math.floor(totals.cash / price)))}>Max</button>
            )}
          </div>

          <div className="order-sum">
            <div className="r">
              <span>Order value</span>
              <b className="num">{rupee(amount, 2)}</b>
            </div>
            <div className="r">
              <span>Est. charges &amp; taxes</span>
              <b className="num">{rupee(charges, 2)}</b>
            </div>
            <div className="r total">
              <span>{side === "BUY" ? "Total payable" : "Net credit"}</span>
              <b className="num">{rupee(total, 2)}</b>
            </div>
          </div>

          {hardErr ? (
            <div className="modal-err">{hardErr}</div>
          ) : submitErr ? (
            <div className="modal-err">{submitErr}</div>
          ) : softWarn ? (
            <div className="modal-err" style={{ color: "var(--muted)" }}>
              {softWarn}
            </div>
          ) : null}
        </div>
        <div className="modal-f">
          <button className="pill ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="pill accent" disabled={!!hardErr || createTx.isPending} onClick={submit}>
            {createTx.isPending ? "Placing…" : `${side} ${qty} ${qty === 1 ? "share" : "shares"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
