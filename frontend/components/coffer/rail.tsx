"use client";
import { useEffect, useState } from "react";

const CofIcon: Record<string, JSX.Element> = {
  dash: (
    <svg className="ic ic-dash" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M4 16.5 a8.5 8.5 0 0 1 16 0" />
      <path className="tick t1" d="M5.6 11.2 L7 12.2" />
      <path className="tick t2" d="M12 7.8 V9.5" />
      <path className="tick t3" d="M18.4 11.2 L17 12.2" />
      <path className="needle" d="M12 16.5 L15.8 12.2" />
      <circle cx="12" cy="16.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  pie: (
    <svg className="ic ic-pie" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="8" width="17" height="11.5" rx="2.4" />
      <path className="handle" d="M9 8 V6.2 a1.7 1.7 0 0 1 1.7 -1.7 h2.6 a1.7 1.7 0 0 1 1.7 1.7 V8" />
      <path className="clasp" d="M3.5 12.5 h6 m5 0 h6" />
      <rect className="lock" x="10.4" y="11" width="3.2" height="3" rx="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  trend: (
    <svg className="ic ic-trend" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <g className="cdl c1"><path d="M6 5.5 V8" /><rect x="4.4" y="8" width="3.2" height="6" rx="1" /><path d="M6 14 V16.5" /></g>
      <g className="cdl c2"><path d="M12 9 V11.5" /><rect x="10.4" y="11.5" width="3.2" height="5.5" rx="1" /><path d="M12 17 V19" /></g>
      <g className="cdl c3"><path d="M18 4 V6.5" /><rect x="16.4" y="6.5" width="3.2" height="6.5" rx="1" /><path d="M18 13 V15" /></g>
    </svg>
  ),
  flow: (
    <svg className="ic ic-flow" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <g className="cyc">
        <path d="M19.5 12 a7.5 7.5 0 0 1 -13.2 4.9" />
        <path d="M4.5 12 a7.5 7.5 0 0 1 13.2 -4.9" />
        <path d="M17.2 4.6 l0.5 2.5 -2.5 0.5" />
        <path d="M6.8 19.4 l-0.5 -2.5 2.5 -0.5" />
      </g>
      <text className="rs" x="12" y="14.6" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7.5" fontWeight="700" fontFamily="inherit">₹</text>
    </svg>
  ),
  card: (
    <svg className="ic ic-card" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect className="slip" x="7" y="3.8" width="12" height="7" rx="1.6" />
      <path d="M3.5 8.5 a2.4 2.4 0 0 1 2.4 -2.4 h0.8" fill="none" />
      <rect x="3.5" y="8.5" width="17" height="11" rx="2.4" fill="#0a0d11" />
      <rect x="3.5" y="8.5" width="17" height="11" rx="2.4" />
      <path className="pocket" d="M14.5 13 h6" />
      <circle className="coin" cx="16.8" cy="14" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),
  doc: (
    <svg className="ic ic-doc" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M4 4 V20 H20" />
      <rect className="bar b1" x="7.5" y="13" width="3" height="4.5" rx="1" />
      <rect className="bar b2" x="12.5" y="9.5" width="3" height="8" rx="1" />
      <rect className="bar b3" x="17.5" y="6" width="3" height="11.5" rx="1" />
    </svg>
  ),
  gear: (
    <svg className="ic ic-gear" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <g className="cog">
        <path d="M12 2.8 l1.2 2.4 2.6 0.4 -0.4 2.6 1.9 1.8 -1.9 1.8 0.4 2.6 -2.6 0.4 -1.2 2.4 -1.2 -2.4 -2.6 -0.4 0.4 -2.6 -1.9 -1.8 1.9 -1.8 -0.4 -2.6 2.6 -0.4 z" transform="translate(0 2)" />
        <circle cx="12" cy="12" r="2.4" transform="translate(0 2)" />
      </g>
    </svg>
  ),
};

const COF_NAV = [
  { id: "dashboard", icon: "dash", label: "Dashboard", kbd: "1" },
  { id: "portfolio", icon: "pie", label: "Portfolio", kbd: "2" },
  { id: "markets", icon: "trend", label: "Markets", kbd: "3" },
  { id: "cashflow", icon: "flow", label: "Cash flow", kbd: "4" },
  { id: "payments", icon: "card", label: "Payments", kbd: "5" },
  { id: "reports", icon: "doc", label: "Reports", kbd: "6" },
];

export function CofRail({
  open, active = "dashboard", onTogglePin, userInitial, userName, aum,
}: {
  open: boolean;
  active?: string;
  onTogglePin: () => void;
  userInitial: string;
  userName: string;
  aum: string;
}) {
  const delay = (i: number) => (open ? { transitionDelay: `${60 + i * 30}ms` } : { transitionDelay: "0ms" });
  return (
    <aside className={`cof-rail ${open ? "open" : ""}`}>
      <button className="logo" type="button" title="Coffer — click to pin" onClick={onTogglePin}>
        <span className="dot">₹</span>
        <span className="nav-label" style={delay(0)}>
          <span className="word">Coffer<small>TERMINAL</small></span>
        </span>
      </button>

      <nav>
        {COF_NAV.map((item, i) => (
          <button key={item.id} type="button" className={`nav-item ${item.id === active ? "active" : ""}`}>
            {CofIcon[item.icon]}
            <span className="nav-label" style={delay(i + 1)}>{item.label}</span>
            <kbd className="nav-kbd nav-label" style={delay(i + 1)}>⌘{item.kbd}</kbd>
          </button>
        ))}
      </nav>

      <div className="spacer" />

      <nav>
        <button type="button" className="nav-item">
          {CofIcon.gear}
          <span className="nav-label" style={delay(7)}>Settings</span>
        </button>
      </nav>
      <div className="user">
        <span className="ava">{userInitial}</span>
        <span className="nav-label" style={delay(8)}>
          <b>{userName}</b>
          <span>{aum}</span>
        </span>
      </div>
    </aside>
  );
}

/* Opens when the cursor is within `edgePct`% of the left edge,
   closes once it travels past the open drawer. */
export function useEdgeDrawer(edgePct = 10) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const DRAWER_W = 248, SLACK = 36;
    const onMove = (e: MouseEvent) => {
      const edge = window.innerWidth * (edgePct / 100);
      setOpen((cur) => {
        if (!cur) return e.clientX <= edge;
        return e.clientX <= DRAWER_W + SLACK;
      });
    };
    const onLeave = () => setOpen(false);
    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [edgePct]);
  return open;
}
