"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast";

type Mode = "signin" | "signup";
type Vars = CSSProperties & Record<string, string | number>;

const COPY: Record<Mode, { title: string; sub: string; cta: string; social: string; switchTxt: string; switchBtn: string }> = {
  signin: {
    title: "Sign in",
    sub: "Welcome back. Access your portfolio.",
    cta: "Log in",
    social: "Sign in",
    switchTxt: "New to Coffer? ",
    switchBtn: "Create an account",
  },
  signup: {
    title: "Create account",
    sub: "Start tracking your portfolio in minutes.",
    cta: "Create account",
    social: "Sign up",
    switchTxt: "Already have an account? ",
    switchBtn: "Sign in",
  },
};

const MIX_LEGEND = [
  { label: "Financials", pct: 38, color: "var(--acc)" },
  { label: "IT services", pct: 24, color: "#6aa8ff" },
  { label: "Energy", pct: 20, color: "#f3b13d" },
  { label: "Pharma", pct: 18, color: "#b48cf2" },
];
const MIX_SEGS = [
  { color: "var(--acc)", dash: 36.5, offset: 0 },
  { color: "#6aa8ff", dash: 22.5, offset: -38 },
  { color: "#f3b13d", dash: 18.5, offset: -62 },
  { color: "#b48cf2", dash: 16.5, offset: -82 },
];
const SCR_BARS = [
  { h: 42 }, { h: 64 }, { h: 30, dn: true }, { h: 78 }, { h: 48, dn: true }, { h: 88 }, { h: 58 },
];

function EyeToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`eye ${on ? "off" : ""}`}
      aria-label={on ? "Hide password" : "Show password"}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 12 C5 7.5 8.5 5.5 12 5.5 C15.5 5.5 19 7.5 21.5 12 C19 16.5 15.5 18.5 12 18.5 C8.5 18.5 5 16.5 2.5 12 Z" />
        <circle cx="12" cy="12" r="3" />
        <line className="slash" x1="4" y1="4" x2="20" y2="20" pathLength={1} />
      </svg>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("investor@coffer.in");
  const [password, setPassword] = useState("vault2026");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "done">("idle");
  const [shake, setShake] = useState(false);

  const c = COPY[mode];

  function switchMode(next: Mode) {
    if (next === mode || submitState !== "idle") return;
    setMode(next);
    setSubmitState("idle");
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }

  function valid() {
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const okPw = password.length >= 4;
    const okName = mode === "signin" || name.trim().length >= 2;
    const okMatch = mode === "signin" || password === confirmPassword;
    return okEmail && okPw && okName && okMatch;
  }

  // Map raw Supabase auth errors to friendlier copy for the toast.
  function readableError(message: string): string {
    if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
    if (/email not confirmed/i.test(message)) return "Confirm your email before signing in.";
    if (/user already registered/i.test(message)) return "That email already has an account — sign in instead.";
    if (/password should be at least/i.test(message)) return "Password is too short (minimum 6 characters).";
    return message || "Something went wrong. Please try again.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitState !== "idle") return;
    if (!valid()) {
      triggerShake();
      return;
    }

    setSubmitState("loading");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) {
        setSubmitState("idle");
        triggerShake();
        toast(readableError(error.message), "down");
        return;
      }
      // No session means Supabase requires email confirmation first.
      if (!data.session) {
        setSubmitState("idle");
        toast("Check your inbox to confirm your email, then sign in.", "neutral");
        switchMode("signin");
        return;
      }
      setSubmitState("done");
      setTimeout(() => router.push("/dashboard"), 650);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setSubmitState("idle");
      triggerShake();
      toast(readableError(error.message), "down");
      return;
    }
    setSubmitState("done");
    setTimeout(() => router.push("/dashboard"), 650);
  }

  async function handleForgot() {
    const addr = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      triggerShake();
      toast("Enter your email above, then tap Forgot.", "neutral");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(addr, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast(readableError(error.message), "down");
      return;
    }
    toast("Password reset link sent — check your inbox.", "neutral");
  }

  function handleSocial() {
    toast("Social sign-in isn't available yet — use email and password.", "neutral");
  }

  /* flowing wave field behind the phone mockup */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = Math.max(1, Math.round(w * dpr));
      canvas!.height = Math.max(1, Math.round(h * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    let mouseX = 0.5, mouseY = 0.5;
    const onMove = (e: MouseEvent) => {
      const r = canvas!.getBoundingClientRect();
      mouseX = (e.clientX - r.left) / r.width;
      mouseY = (e.clientY - r.top) / r.height;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const waves = [
      { amp: 30, freq: 0.0028, speed: 0.6, y: 0.66, col: "rgba(126,240,166,0.5)", lw: 1.6 },
      { amp: 48, freq: 0.0019, speed: -0.4, y: 0.7, col: "rgba(126,240,166,0.14)", lw: 1.2 },
      { amp: -30, freq: 0.0028, speed: -0.6, y: 0.34, col: "rgba(126,240,166,0.5)", lw: 1.6 },
      { amp: -48, freq: 0.0019, speed: 0.4, y: 0.3, col: "rgba(120,170,255,0.14)", lw: 1.2 },
    ];
    const candles = [
      { bh: 32, wh: 50, up: true },
      { bh: 20, wh: 36, up: false },
      { bh: 42, wh: 60, up: true },
      { bh: 26, wh: 42, up: false },
    ];

    let t = 0;
    let rafId = 0;

    function drawCandles(waveRef: (typeof waves)[number], dir: 1 | -1) {
      const travel = w + 200;
      const gap = travel / candles.length;
      const cspeed = 0.5;
      candles.forEach((cd, i) => {
        const prog = (t * cspeed + i * gap) % travel;
        const x = (dir < 0 ? travel - prog : prog) - 100;
        let a = Math.min(x / 80, (travel - 200 - x) / 80);
        a = Math.max(0, Math.min(1, a));
        if (a <= 0) return;
        const m = (1 - Math.abs(x / w - mouseX)) * 16 * Math.sign(waveRef.amp || 1);
        const cy = h * waveRef.y + (mouseY - 0.5) * 9
          + Math.sin(x * waveRef.freq + t * 0.01 * waveRef.speed * 3) * (waveRef.amp + m)
          + Math.sin(x * waveRef.freq * 2.3 + t * 0.02) * (waveRef.amp * 0.25);
        const stroke = cd.up ? "126,240,166" : "226,101,79";
        ctx!.globalAlpha = a * 0.85;
        ctx!.strokeStyle = `rgba(${stroke},0.9)`;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(x, cy - cd.wh / 2);
        ctx!.lineTo(x, cy + cd.wh / 2);
        ctx!.stroke();
        ctx!.fillStyle = `rgba(${stroke},0.32)`;
        ctx!.strokeStyle = `rgba(${stroke},0.95)`;
        const bw = 9;
        ctx!.beginPath();
        ctx!.rect(x - bw / 2, cy - cd.bh / 2, bw, cd.bh);
        ctx!.fill();
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      });
    }

    function frame() {
      t += 1;
      ctx!.clearRect(0, 0, w, h);

      ctx!.strokeStyle = "rgba(255,255,255,0.03)";
      ctx!.lineWidth = 1;
      for (let x = 0; x <= w; x += 46) {
        ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, h); ctx!.stroke();
      }

      waves.forEach((wv, idx) => {
        ctx!.beginPath();
        ctx!.strokeStyle = wv.col;
        ctx!.lineWidth = wv.lw;
        const baseY = h * wv.y + (mouseY - 0.5) * 30 * (idx + 1) * 0.3;
        for (let x = 0; x <= w; x += 6) {
          const m = (1 - Math.abs(x / w - mouseX)) * 16;
          const y = baseY
            + Math.sin(x * wv.freq + t * 0.01 * wv.speed * 3) * (wv.amp + m)
            + Math.sin(x * wv.freq * 2.3 + t * 0.02) * (wv.amp * 0.25);
          if (x === 0) ctx!.moveTo(x, y); else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      });

      const wv = waves[0];
      for (let k = 0; k < 3; k++) {
        const px = ((t * (1.0 + k * 0.5)) % (w + 60)) - 30;
        const baseY = h * wv.y + (mouseY - 0.5) * 10;
        const py = baseY + Math.sin(px * wv.freq + t * 0.03) * wv.amp;
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(150,245,185,${0.9 - k * 0.25})`;
        ctx!.arc(px, py, 2.2 - k * 0.4, 0, Math.PI * 2);
        ctx!.fill();
      }

      drawCandles(waves[0], 1);
      drawCandles(waves[2], -1);

      if (!reduce) rafId = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="cof-auth">
      {/* ============ LEFT: brand panel ============ */}
      <section className="auth-brand">
        <div className="auth-hero">
          <span className="ey lbl">Secure access</span>
          <h1>Open your<br /><span className="ic">coffer.</span></h1>

          <div className="left-stage">
            <canvas className="stage-wave" ref={canvasRef} />
            <div className="device">
              <span className="notch" />
              <div className="screen">
                <div className="scr-head">This week · 4–10 Jun</div>
                <div className="scr-bal"><span className="cur">₹</span>89,712<span className="dec">.40</span></div>
                <div className="scr-sub">▲ +6.4% vs last week</div>

                <svg className="scr-spark" viewBox="0 0 200 40" preserveAspectRatio="none" fill="none">
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop className="s0" offset="0" />
                      <stop className="s1" offset="1" />
                    </linearGradient>
                  </defs>
                  <path className="area" d="M0 30 L20 27 L40 31 L60 22 L80 25 L100 16 L120 19 L140 11 L160 14 L180 6 L200 9 L200 40 L0 40 Z" fill="url(#sg)" />
                  <path className="ln" d="M0 30 L20 27 L40 31 L60 22 L80 25 L100 16 L120 19 L140 11 L160 14 L180 6 L200 9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <div className="scr-bars">
                  {SCR_BARS.map((b, i) => (
                    <i key={i} className={b.dn ? "dn" : ""} style={{ "--h": `${b.h}%` } as Vars} />
                  ))}
                </div>
                <div className="scr-dow"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>

                <div className="scr-bottom">
                  <div className="mix-card">
                    <svg className="mix" viewBox="0 0 40 40">
                      {MIX_SEGS.map((s, i) => (
                        <circle
                          key={i}
                          className="seg"
                          style={{ "--c": s.color } as Vars}
                          cx={20} cy={20} r={15.5}
                          pathLength={100}
                          strokeDasharray={`${s.dash} 100`}
                          strokeDashoffset={s.offset}
                        />
                      ))}
                    </svg>
                    <div className="mix-legend">
                      {MIX_LEGEND.map((m) => (
                        <span key={m.label}><i style={{ background: m.color }} />{m.label}<b>{m.pct}%</b></span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-foot">
          <span><span className="dot" />Encrypted · TLS 1.3</span>
        </div>
      </section>

      {/* ============ RIGHT: form ============ */}
      <section className="auth-form">
        <div className={["auth-card", "anim-fields", mode === "signup" && "signup", shake && "shake"].filter(Boolean).join(" ")}>

          <div className="mini-brand">
            <span className="sq">₹</span><b>Coffer</b>
          </div>

          <div className={["tabs", mode === "signup" && "signup"].filter(Boolean).join(" ")}>
            <span className="glider" />
            <button type="button" className={mode === "signin" ? "on" : ""} onClick={() => switchMode("signin")}>Sign in</button>
            <button type="button" className={mode === "signup" ? "on" : ""} onClick={() => switchMode("signup")}>Sign up</button>
          </div>

          <div className="head">
            <h2>{c.title}</h2>
            <p>{c.sub}</p>
          </div>

          <div className="social">
            <button type="button" onClick={handleSocial}>
              <svg viewBox="0 0 24 24"><path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 0 1 0-24c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7A19.9 19.9 0 0 0 24 4a20 20 0 1 0 19.6 16.5z" transform="scale(.5)" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7A19.9 19.9 0 0 0 24 4 20 20 0 0 0 6.3 14.7z" transform="scale(.5)" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" transform="scale(.5)" /><path fill="#1976D2" d="M43.6 20.5h-1.9V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 41.6 44 38 44 28c0-1.3-.1-2.5-.4-3.5z" transform="scale(.5)" /></svg>
              <span><span className="lab-mode">{c.social}</span> with Google</span>
            </button>
            <button type="button" onClick={handleSocial}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.04c-.03-2.6 2.12-3.84 2.22-3.9-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.23 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.28-1.27 3.13-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.75-4.13M14.56 3.94c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.97-1.08 3.14 1.14.09 2.3-.58 3.01-1.43" /></svg>
              <span><span className="lab-mode">{c.social}</span> with Apple</span>
            </button>
          </div>

          <div className="divider"><span>or continue with email</span></div>

          <form key={mode} onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className="field only-signup">
              <label htmlFor="name">Full name</label>
              <div className="input">
                <input type="text" id="name" placeholder="Nishant Rao" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="input">
                <input type="email" id="email" placeholder="you@coffer.in" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="pw">Password</label>
              <div className="input">
                <input type={showPw ? "text" : "password"} id="pw" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <EyeToggle on={showPw} onClick={() => setShowPw((s) => !s)} />
              </div>
            </div>

            <div className="field only-signup">
              <label htmlFor="pw2">Confirm password</label>
              <div className="input">
                <input type={showPw2 ? "text" : "password"} id="pw2" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <EyeToggle on={showPw2} onClick={() => setShowPw2((s) => !s)} />
              </div>
            </div>

            <div className="row only-signin">
              <label className="check">
                <input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)} />
                <span className="box" />
                Keep me signed in
              </label>
              <a className="forgot" href="#" onClick={(e) => { e.preventDefault(); handleForgot(); }}>Forgot?</a>
            </div>

            <button type="submit" className={["submit", submitState !== "idle" && submitState].filter(Boolean).join(" ")}>
              <span className="lab">{c.cta} <span className="arr">→</span></span>
              <span className="spin" />
              <svg className="chk" viewBox="0 0 28 28"><path d="M6 14.5 L12 20 L22 8" /></svg>
            </button>

            <p className="terms only-signup">By creating an account you agree to our <a href="#" onClick={(e) => e.preventDefault()}>Terms</a> and <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.</p>
          </form>

          <p className="switch"><span>{c.switchTxt}</span><button type="button" onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}>{c.switchBtn}</button></p>
        </div>
      </section>
    </div>
  );
}
