"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const [email, setEmail] = useState("investor@coffer.in");
  const [password, setPassword] = useState("vault2026");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const [cardPre, setCardPre] = useState(true);
  const [clock, setClock] = useState("—");
  const [btnState, setBtnState] = useState<"idle" | "loading" | "done">("idle");
  const [vaultShow, setVaultShow] = useState(false);
  const [vaultUnlocking, setVaultUnlocking] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [vaultFlash, setVaultFlash] = useState(false);

  /* body class */
  useEffect(() => {
    document.body.classList.add("login-body");
    return () => document.body.classList.remove("login-body");
  }, []);

  /* card entrance */
  useEffect(() => {
    const r1 = requestAnimationFrame(() =>
      requestAnimationFrame(() => setCardPre(false))
    );
    const t = setTimeout(() => setCardPre(false), 200);
    return () => { cancelAnimationFrame(r1); clearTimeout(t); };
  }, []);

  /* IST clock */
  useEffect(() => {
    let raf: number;
    let timeout: ReturnType<typeof setTimeout>;
    function tick() {
      const ist = new Date(
        Date.now() + new Date().getTimezoneOffset() * 60000 + 5.5 * 3600000
      );
      setClock(
        ist.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " IST"
      );
      timeout = setTimeout(() => { raf = requestAnimationFrame(tick); }, 1000);
    }
    tick();
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, []);

  /* background wave canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener("resize", size);

    let mx = 0.5, my = 0.5;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX / innerWidth;
      my = e.clientY / innerHeight;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const waves = [
      { amp: 50, freq: 0.0016, speed: 0.6,  y: 0.72, col: "rgba(140,235,175,0.4)",  lw: 1.5 },
      { amp: 80, freq: 0.0011, speed: -0.4, y: 0.76, col: "rgba(140,235,175,0.12)", lw: 1.1 },
      { amp: 34, freq: 0.0026, speed: 0.9,  y: 0.68, col: "rgba(255,255,255,0.07)", lw: 1.0 },
    ];

    let t = 0, rafId = 0;

    function frame() {
      t += 1;
      ctx!.clearRect(0, 0, w, h);
      ctx!.strokeStyle = "rgba(255,255,255,0.022)";
      ctx!.lineWidth = 1;
      for (let x = 0; x <= w; x += 80) {
        ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, h); ctx!.stroke();
      }
      waves.forEach((wv, idx) => {
        ctx!.beginPath();
        ctx!.strokeStyle = wv.col;
        ctx!.lineWidth = wv.lw;
        const baseY = h * wv.y + (my - 0.5) * 30 * (idx + 1) * 0.3;
        for (let x = 0; x <= w; x += 6) {
          const m = (1 - Math.abs(x / w - mx)) * 22;
          const y =
            baseY +
            Math.sin(x * wv.freq + t * 0.03 * wv.speed * 10) * (wv.amp + m) +
            Math.sin(x * wv.freq * 2.3 + t * 0.02) * (wv.amp * 0.25);
          x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      });

      const wv = waves[0];
      for (let k = 0; k < 2; k++) {
        const px = ((t * (1.2 + k * 0.6)) % (w + 80)) - 40;
        const py = h * wv.y + Math.sin(px * wv.freq + t * 0.03) * wv.amp;
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(160,245,190,${0.8 - k * 0.3})`;
        ctx!.arc(px, py, 2.2 - k * 0.4, 0, 7);
        ctx!.fill();
      }
      if (!reduce) rafId = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", size);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  function triggerShake(msg: string) {
    setErr(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function runVault() {
    setVaultShow(true);
    setTimeout(() => setVaultUnlocking(true), 480);
    setTimeout(() => setVaultOpen(true), 1880);
    setTimeout(() => setVaultFlash(true), 2880);
    setTimeout(() => {
      try { localStorage.setItem("coffer_authed", "1"); } catch {}
      router.push("/dashboard");
    }, 3380);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (btnState !== "idle") return;
    setErr("");
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) { triggerShake("Enter a valid email address"); return; }
    if (!password.trim()) { triggerShake("Enter your password"); return; }
    setBtnState("loading");
    setTimeout(() => setBtnState("done"), 1450);
    setTimeout(runVault, 2150);
  }

  const vaultClass = [
    "vault-stage",
    vaultShow && "show",
    vaultUnlocking && "unlocking",
    vaultOpen && "open",
    vaultFlash && "flash",
  ].filter(Boolean).join(" ");

  return (
    <>
      <canvas id="login-canvas" ref={canvasRef} />
      <div className="login-veil" />

      <div className="login-top">
        <Link className="brand" href="/">
          <span className="dot" />
          Coff<span style={{ color: "var(--accent)", fontWeight: 500, marginLeft: "-0.36em" }}>₹</span>
        </Link>
        <Link className="back" href="/">← Back to site</Link>
      </div>

      <div className="login-corner bl">Encrypted · TLS 1.3</div>
      <div className="login-corner br">{clock}</div>

      <main className="login-stage">
        <div
          className={["login-card", cardPre && "pre", shake && "shake"]
            .filter(Boolean).join(" ")}
        >
          <p className="eyebrow login-eyebrow">— Secure Access —</p>
          <h1>Open your<br />coffer</h1>
          <p className="lede">
            Sign in to manage your Indian equity portfolio, holdings, and orders.
          </p>

          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <div className="login-input-wrap">
                <input
                  type="email"
                  id="email"
                  placeholder="you@coffer.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="fic">✉</span>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="pw">Password</label>
              <div className="login-input-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  id="pw"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle"
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="login-row">
              <label className="login-check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="box" />
                Keep me signed in
              </label>
              <a className="forgot" href="#">Forgot?</a>
            </div>

            <div className={["login-err", err && "show"].filter(Boolean).join(" ")}>
              {err}
            </div>

            <div className="btn-wrap">
              <button
                type="submit"
                className={["login-btn", btnState !== "idle" && btnState]
                  .filter(Boolean).join(" ")}
              >
                <span className="btn-label">
                  Enter the Vault <span className="arr">↗</span>
                </span>
                <span className="btn-spinner" />
                <svg className="btn-check" viewBox="0 0 28 28">
                  <path d="M6 14.5 L12 20 L22 8" />
                </svg>
              </button>
            </div>
          </form>

          <p className="login-foot">
            No account? <a href="#">Request access</a>
          </p>
          <p className="login-hint">
            Demo — credentials are pre-filled. Just press <b>Enter the Vault</b>.
          </p>
        </div>
      </main>

      {/* vault reveal */}
      <div className={vaultClass} aria-hidden="true">
        <div className="vault">
          <div className="vault-core" />
          <div className="vault-ring r1" />
          <div className="vault-ring r2" />
          <div className="vault-ring r3" />
          <div className="vault-frame" />
          <div className="vault-door left">
            <div className="vault-face" />
          </div>
          <div className="vault-door right">
            <div className="vault-face" />
          </div>
          <div className="vault-seam" />
          <div className="vault-bolt n" />
          <div className="vault-bolt s" />
          <div className="vault-bolt e" />
          <div className="vault-bolt w" />
          <div className="vault-dial">
            <span className="spoke" />
            <span className="spoke" />
            <span className="spoke" />
            <span className="hub" />
          </div>
        </div>
        <p className="vault-msg">Unlocking your coffer…</p>
        <div className="vault-flash" />
      </div>
    </>
  );
}
