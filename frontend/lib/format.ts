// Indian-numbering money + percent formatters, ported from the design prototype
// (pms-components.jsx). Display-only — money correctness lives in the backend.

const inr0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function fmt(n: number, d = 2): string {
  return (n ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  });
}

export function rupee(n: number, d = 2): string {
  return "₹" + fmt(Math.abs(n ?? 0), d);
}

export function rupeeSigned(n: number, d = 2): string {
  return (n < 0 ? "−₹" : "₹") + fmt(Math.abs(n ?? 0), d);
}

export function pct(n: number, d = 2): string {
  const v = n ?? 0;
  return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(d) + "%";
}

// Compact ₹ for big values: ₹18.04 L / ₹1.80 Cr
export function rupeeCompact(n: number): string {
  const v = n ?? 0;
  const a = Math.abs(v);
  if (a >= 1e7) return "₹" + (v / 1e7).toFixed(2) + " Cr";
  if (a >= 1e5) return "₹" + (v / 1e5).toFixed(2) + " L";
  return "₹" + inr0.format(Math.round(v));
}
