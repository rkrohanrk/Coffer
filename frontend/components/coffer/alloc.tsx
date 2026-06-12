"use client";
import { useState } from "react";

import { rupeeCompact } from "@/lib/format";
import type { AllocationItem } from "@/lib/types";

export const COF_SECTOR_COLORS = [
  "var(--acc)",
  "#6aa8ff",
  "#f3b13d",
  "#b48cf2",
  "#e2654f",
  "#5fd4c9",
  "#646c78",
];

function CofDonut({
  data, hover, setHover, totalValue, size = 218,
}: {
  data: AllocationItem[]; hover: number | null; setHover: (i: number | null) => void; totalValue: number; size?: number;
}) {
  const r = 78, cx = size / 2, cy = size / 2;
  const C = 2 * Math.PI * r;
  const GAP = 2.5; // degrees of breathing room between segments

  let acc = 0;
  const segs = data.map((s, i) => {
    const start = acc; acc += s.weight;
    const frac = s.weight / 100;
    const gapFrac = GAP / 360;
    return {
      i, ...s,
      dash: `${Math.max(0.001, (frac - gapFrac)) * C} ${C}`,
      rot: (start / 100) * 360 - 90 + GAP / 2,
      color: COF_SECTOR_COLORS[i % COF_SECTOR_COLORS.length],
    };
  });

  const active = hover == null ? null : data[hover];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Sector allocation donut">
      {segs.map((s) => (
        <circle key={s.i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color}
          strokeWidth={hover === s.i ? 26 : 18}
          strokeLinecap="butt"
          strokeDasharray={s.dash}
          opacity={hover == null || hover === s.i ? 1 : 0.22}
          transform={`rotate(${s.rot} ${cx} ${cy})`}
          style={{ transition: "stroke-width 0.22s ease, opacity 0.25s ease", cursor: "pointer" }}
          onMouseEnter={() => setHover(s.i)} onMouseLeave={() => setHover(null)}
        />
      ))}
      <text x={cx} y={cy - 8} textAnchor="middle"
        style={{ fill: "var(--b-fg)", fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700 }}>
        {active ? `${active.weight.toFixed(1)}%` : rupeeCompact(totalValue)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle"
        style={{ fill: "var(--b-mut)", fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }}>
        {active ? active.label : "Total value"}
      </text>
    </svg>
  );
}

export function CofAllocation({
  items, totalValue, delay = 140,
}: {
  items: AllocationItem[]; totalValue: number; delay?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="card rise" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div className="lbl">Portfolio allocation · by sector</div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--b-mut)", whiteSpace: "nowrap" }}>
          {items.length} sectors
        </span>
      </div>
      {items.length === 0 ? (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--b-faint)", padding: "24px 0" }}>
          No holdings yet
        </div>
      ) : (
        <div className="cof-alloc">
          <div className="cof-alloc-donut">
            <CofDonut data={items} hover={hover} setHover={setHover} totalValue={totalValue} />
          </div>
          <div className="cof-alloc-legend">
            {items.map((s, i) => (
              <div key={s.label}
                className={`cof-alloc-row ${hover === i ? "hot" : ""} ${hover != null && hover !== i ? "dim" : ""}`}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <span className="sw" style={{ background: COF_SECTOR_COLORS[i % COF_SECTOR_COLORS.length] }} />
                <span className="nm">{s.label}</span>
                <span className="amt">{rupeeCompact(s.market_value)}</span>
                <span className="fs-delta" style={{ color: "var(--b-faint)" }}>—</span>
                <span className="pct">{s.weight.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
