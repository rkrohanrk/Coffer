"use client";
import { useEffect, useRef, useState } from "react";

import { fmt, pct, rupeeCompact, rupeeSigned } from "@/lib/format";
import { sectorColor, tkLabel } from "@/lib/sectors";

/* ---------- sector ticker badge ---------- */
export function Tk({
  sym,
  sector,
  size = 34,
}: {
  sym: string;
  sector: string | null;
  size?: number;
}) {
  return (
    <div
      className="tk"
      style={{ width: size, height: size, background: sectorColor(sector) }}
    >
      {tkLabel(sym)}
    </div>
  );
}

/* ---------- delta chip ---------- */
export function Delta({
  pctVal,
  money,
}: {
  pctVal: number;
  money?: number | null;
}) {
  const up = pctVal >= 0;
  return (
    <span className="d">
      <span className={up ? "up" : "down"}>{up ? "▲" : "▼"}</span>
      {money != null && (
        <span className={up ? "up" : "down"}>{rupeeSigned(money, 0)}</span>
      )}
      <span className={"chip " + (up ? "chip-up" : "chip-down")}>
        {pct(pctVal)}
      </span>
    </span>
  );
}

/* ---------- sparkline (svg) ---------- */
export function Sparkline({
  data,
  w = 84,
  h = 28,
  up,
}: {
  data: number[];
  w?: number;
  h?: number;
  up: boolean;
}) {
  const id = useRef("sg" + Math.round(Math.random() * 1e6)).current;
  if (!data.length) return <svg className="spark" width={w} height={h} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / rng) * (h - 4) - 2;
      return x.toFixed(1) + "," + y.toFixed(1);
    })
    .join(" ");
  const col = up ? "var(--up)" : "var(--down)";
  return (
    <svg
      className="spark"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={col} stopOpacity="0.22" />
          <stop offset="1" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} stroke="none" />
      <polyline
        points={pts}
        fill="none"
        stroke={col}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- donut (allocation) ---------- */
export interface DonutSegment {
  name: string;
  pct: number;
  color: string;
}

export function Donut({
  segments,
  centerTop,
  centerBot,
}: {
  segments: DonutSegment[];
  centerTop: React.ReactNode;
  centerBot: string;
}) {
  let acc = 0;
  const stops = segments
    .map((s) => {
      const from = acc;
      acc += s.pct;
      return `${s.color} ${from}% ${acc}%`;
    })
    .join(", ");
  return (
    <div
      className="donut"
      style={{ background: `conic-gradient(${stops || "var(--line) 0 100%"})` }}
    >
      <div className="ctr">
        <div>
          <b>{centerTop}</b>
          <span>{centerBot}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- NAV area chart (canvas) ---------- */
export function NavChart({ data, height = 230 }: { data: number[]; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const cv = ref.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap || data.length < 2) return;
    let raf = 0;
    function draw() {
      if (!cv || !wrap) return;
      const w = wrap.clientWidth;
      const h = height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = w * dpr;
      cv.height = h * dpr;
      cv.style.height = h + "px";
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const pad = { l: 8, r: 8, t: 16, b: 18 };
      const min = Math.min(...data);
      const max = Math.max(...data);
      const rng = max - min || 1;
      const X = (i: number) => pad.l + (i / (data.length - 1)) * (w - pad.l - pad.r);
      const Y = (v: number) => pad.t + (1 - (v - min) / rng) * (h - pad.t - pad.b);

      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let g = 0; g <= 3; g++) {
        const y = pad.t + (g / 3) * (h - pad.t - pad.b);
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(w - pad.r, y);
        ctx.stroke();
      }

      const grad = ctx.createLinearGradient(0, pad.t, 0, h);
      grad.addColorStop(0, "rgba(130,230,165,0.20)");
      grad.addColorStop(1, "rgba(130,230,165,0)");
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = X(i);
        const y = Y(v);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.lineTo(X(data.length - 1), h - pad.b);
      ctx.lineTo(X(0), h - pad.b);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      data.forEach((v, i) => {
        const x = X(i);
        const y = Y(v);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.strokeStyle = "rgba(150,240,185,0.95)";
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.stroke();

      const lx = X(data.length - 1);
      const ly = Y(data[data.length - 1]);
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, 7);
      ctx.fillStyle = "rgb(150,240,185)";
      ctx.fill();

      if (hover != null && data[hover] != null) {
        const hx = X(hover);
        const hy = Y(data[hover]);
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.beginPath();
        ctx.moveTo(hx, pad.t);
        ctx.lineTo(hx, h - pad.b);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx, hy, 3.5, 0, 7);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
    }
    draw();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    });
    ro.observe(wrap);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [data, height, hover]);

  function onMove(e: React.MouseEvent) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const x = e.clientX - r.left;
    const pad = 8;
    const frac = Math.max(0, Math.min(1, (x - pad) / (r.width - pad * 2)));
    setHover(Math.round(frac * (data.length - 1)));
  }
  const hv = hover != null ? data[hover] : null;

  return (
    <div
      className="navchart"
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
      style={{ position: "relative" }}
    >
      <canvas ref={ref} />
      {hv != null && (
        <div
          className="num"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            fontSize: "0.72rem",
            color: "var(--fg)",
          }}
        >
          {rupeeCompact(hv)}
        </div>
      )}
    </div>
  );
}

/* ---------- stat card ---------- */
export function Stat({
  k,
  value,
  sub,
  deltaPct,
  deltaMoney,
  neutral,
}: {
  k: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  deltaPct?: number | null;
  deltaMoney?: number | null;
  neutral?: boolean;
}) {
  const up = (deltaPct ?? 0) >= 0;
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v">{value}</div>
      {deltaPct != null ? (
        <div className="d">
          {!neutral && <span className={up ? "up" : "down"}>{up ? "▲" : "▼"}</span>}
          {deltaMoney != null && (
            <span className={up ? "up" : "down"}>{rupeeSigned(deltaMoney, 0)}</span>
          )}
          <span className={"chip " + (up ? "chip-up" : "chip-down")}>
            {pct(deltaPct)}
          </span>
        </div>
      ) : (
        <div className="d" style={{ color: "var(--faint)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
