"use client";
import { useEffect, useId, useState } from "react";

/* ---------- count-up ---------- */
export function useCountUp(target: number, dur = 1300, delay = 0) {
  const skip =
    typeof document !== "undefined" &&
    (document.hidden || (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
  const [v, setV] = useState(skip ? target : 0);
  useEffect(() => {
    if (skip) { setV(target); return; }
    let raf = 0;
    let t0: number | null = null;
    let killed = false;
    const tick = (ts: number) => {
      if (killed) return;
      if (t0 === null) t0 = ts;
      const p = Math.min(1, (ts - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      setV(target * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const to = setTimeout(() => { raf = requestAnimationFrame(tick); }, delay);
    const snap = setTimeout(() => { if (!killed) setV(target); }, delay + dur + 200);
    return () => { killed = true; clearTimeout(to); clearTimeout(snap); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, dur, delay]);
  return v;
}

export function Num({
  v, fmt, prefix = "", suffix = "", dur = 1300, delay = 0,
}: {
  v: number; fmt?: (n: number) => string; prefix?: string; suffix?: string; dur?: number; delay?: number;
}) {
  const n = useCountUp(v, dur, delay);
  const f = fmt || ((x: number) => Math.round(x).toLocaleString("en-IN"));
  return <span>{prefix}{f(n)}{suffix}</span>;
}

/* ---------- path helpers ---------- */
export function linePath(data: number[], w: number, h: number, pad = 2) {
  const min = Math.min(...data), max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((d, i) => [
    pad + (i / (data.length - 1)) * (w - pad * 2),
    h - pad - ((d - min) / rng) * (h - pad * 2),
  ]);
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return { d, pts };
}

/* ---------- big area chart with draw-in ---------- */
export function AreaChart({
  data, w = 600, h = 180, color = "var(--acc)", grid = 4, delay = 0,
}: {
  data: number[]; w?: number; h?: number; color?: string; grid?: number; delay?: number;
}) {
  const { d, pts } = linePath(data, w, h, 4);
  const area = `${d} L ${pts[pts.length - 1][0]},${h} L ${pts[0][0]},${h} Z`;
  const last = pts[pts.length - 1];
  const id = "ag" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="fs-area" style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: grid }, (_, i) => (
        <line key={i} x1="0" x2={w} y1={(h / grid) * (i + 0.5)} y2={(h / grid) * (i + 0.5)}
          stroke="currentColor" strokeOpacity="0.07" strokeDasharray="2 5" />
      ))}
      <path d={area} fill={`url(#${id})`} className="fs-fade" style={{ animationDelay: `${delay + 500}ms` }} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} pathLength={1}
        className="fs-draw" style={{ animationDelay: `${delay}ms` }} />
      <circle cx={last[0]} cy={last[1]} r={3.5} fill={color} className="fs-fade" style={{ animationDelay: `${delay + 700}ms` }} />
      <circle cx={last[0]} cy={last[1]} r={8} fill="none" stroke={color} strokeOpacity={0.4} className="fs-pulse" />
    </svg>
  );
}

/* ---------- tiny sparkline ---------- */
export function Spark({
  data, w = 84, h = 26, color = "var(--acc)", delay = 0,
}: {
  data: number[]; w?: number; h?: number; color?: string; delay?: number;
}) {
  const { d } = linePath(data, w, h, 2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h, display: "block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} pathLength={1}
        className="fs-draw" style={{ animationDelay: `${delay}ms` }} />
    </svg>
  );
}

/* ---------- up/down delta chip ---------- */
export function Delta({ v, className = "" }: { v: number; className?: string }) {
  const up = v >= 0;
  return (
    <span className={`fs-delta ${up ? "up" : "down"} ${className}`}>
      <svg width={9} height={9} viewBox="0 0 10 10" style={{ transform: up ? "none" : "scaleY(-1)" }}>
        <path d="M5 1 L9 7 L1 7 Z" fill="currentColor" />
      </svg>
      {up ? "+" : ""}{v.toFixed(2)}%
    </span>
  );
}
