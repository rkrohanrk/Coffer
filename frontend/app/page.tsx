'use client';

import { useEffect, useRef } from 'react';

const CASES = [
  {
    tags: ['FIFO', 'Cost Basis'],
    title: 'Lot-level cost basis',
    desc: 'Every SELL is matched against open lots in FIFO order, so realised P&L and remaining cost basis are exact — no averaging, no guesswork.',
    href: '/dashboard',
    ph: 'holdings table',
  },
  {
    tags: ['STCG', 'LTCG'],
    title: 'Indian capital-gains tax',
    desc: 'Each disposal is classified STCG or LTCG at the 12-month boundary, with the ₹1.25 L LTCG exemption applied per financial year — STCG 20%, LTCG 12.5%.',
    href: '/dashboard',
    ph: 'tax summary',
  },
  {
    tags: ['XIRR', 'TWR'],
    title: 'Returns that actually mean something',
    desc: 'Money-weighted XIRR alongside time-weighted return via Modified Dietz — so cash flows and SIPs never distort how your portfolio really performed.',
    href: '/dashboard',
    ph: 'performance chart',
  },
  {
    tags: ['CSV', 'Bulk import'],
    title: 'All-or-nothing CSV import',
    desc: 'Drop a broker export and preview every row before it lands. A single validation error cancels the whole file — your ledger never ends up half-imported.',
    href: '/dashboard',
    ph: 'import preview',
  },
  {
    tags: ['NSE', 'BSE'],
    title: 'End-of-day pricing',
    desc: 'Closing prices for NSE (.NS) and BSE (.BO) listed securities, refreshed nightly at 21:33 IST — three minutes after the market closes.',
    href: '/dashboard',
    ph: 'allocation view',
  },
  {
    tags: ['Multi-user', 'Isolated'],
    title: 'Every account, fully isolated',
    desc: 'Accounts, holdings and transactions are scoped to your user on every query. Your data is yours alone — nothing leaks across users.',
    href: '/dashboard',
    ph: 'accounts',
  },
];

const EXPERIENCE = [
  {
    yr: '01',
    role: 'Add your accounts',
    co: 'DEMAT · MF FOLIO · PPF · NPS',
    desc: 'Create accounts for each broker or scheme you hold — Zerodha, Groww, Upstox and the rest — then add the assets you trade across NSE and BSE.',
  },
  {
    yr: '02',
    role: 'Import your transactions',
    co: 'CSV · all-or-nothing',
    desc: 'Upload buys, sells, splits, deposits and withdrawals from a CSV, or enter them by hand. Every row is validated before anything is committed.',
  },
  {
    yr: '03',
    role: 'Holdings derive themselves',
    co: 'no holdings table',
    desc: 'Coffer rebuilds your positions straight from the transaction ledger using FIFO — so what you see is always a faithful replay of what you did.',
  },
  {
    yr: '04',
    role: 'Prices refresh overnight',
    co: '21:33 IST · weekdays',
    desc: 'A nightly job pulls closing prices for every listed security right after the NSE close, keeping valuations current without any real-time noise.',
  },
  {
    yr: '05',
    role: 'Read your returns & tax',
    co: 'XIRR · TWR · STCG/LTCG',
    desc: 'See performance, allocation and an FY-aware tax estimate — bucketed April to March, the way the Indian financial year actually runs.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Does Coffer connect to my broker?',
    a: 'No login or trading access required. You bring your data in by importing a broker CSV or entering transactions by hand — Coffer only ever reads, never trades. Holdings are rebuilt from that ledger, so it holds positions you chose to share, nothing more.',
  },
  {
    q: 'Which accounts and assets does Coffer support?',
    a: 'Equities, ETFs and listed mutual funds on the NSE and BSE, across as many demat and folio accounts as you hold — Zerodha, Groww, Upstox and the rest. Non-listed mutual funds by AMFI code are on the way.',
  },
  {
    q: 'Does Coffer give financial advice?',
    a: "No. Coffer is a clarity tool, not an advisor. It surfaces what's already there — cost basis, realised gains, allocation and returns — but every decision stays entirely yours.",
  },
  {
    q: 'How is my data protected?',
    a: "Every account, holding and transaction is scoped strictly to your user_id, with separation enforced on every query by design. Coffer stores only the transactions you enter — no broker credentials, no trading keys, nothing it doesn't need.",
  },
  {
    q: 'How are my gains and taxes calculated?',
    a: 'Every sell is matched against open lots in FIFO order, then classified STCG or LTCG at the 12-month boundary — STCG 20%, LTCG 12.5% with the ₹1.25 L exemption, bucketed by the April–March financial year. All in ₹.',
  },
  {
    q: 'Do prices update in real time?',
    a: "No — and that's deliberate. Coffer pulls NSE and BSE closing prices nightly at 21:33 IST, three minutes after the market closes. You get accurate end-of-day valuations without the noise of intraday ticks.",
  },
];

const SKILLS = [
  { t: 'FIFO cost basis', d: 'Pure, tested lot-matching for realised gains and remaining basis.' },
  { t: 'XIRR', d: 'Money-weighted return over irregular cash flows, solved numerically.' },
  { t: 'Modified Dietz', d: 'Time-weighted return that neutralises the timing of deposits.' },
  { t: 'STCG / LTCG', d: 'Holding-period classification and post-Jul-2024 rates in INR.' },
  { t: 'User isolation', d: 'Every query scoped to user_id — strict separation by design.' },
  { t: 'CSV engine', d: 'Validated, all-or-nothing imports with a full pre-commit preview.' },
  { t: 'EOD pricing', d: 'Nightly NSE/BSE close via a pluggable price-provider interface.' },
  { t: 'FY reporting', d: 'Periods and tax bucketed April–March for the Indian financial year.' },
];

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.body.classList.add('loading');

    let preloaderTimeout: ReturnType<typeof setTimeout> | undefined;
    let rafId: number;
    let revealObs: IntersectionObserver | null = null;

    // ── preloader wave bars ──────────────────────────────────
    const wave = document.getElementById('pre-wave');
    if (wave) {
      for (let i = 0; i < 7; i++) {
        const s = document.createElement('span');
        s.style.animationDelay = i * 0.09 + 's';
        s.style.height = 8 + Math.random() * 20 + 'px';
        wave.appendChild(s);
      }
    }

    // ── scroll reveal ────────────────────────────────────────
    function initReveal() {
      revealObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add('in');
              revealObs!.unobserve(en.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
      );
      document.querySelectorAll('.reveal:not(.in)').forEach((el) =>
        revealObs!.observe(el),
      );
    }

    // ── preloader counter ────────────────────────────────────
    const pre = document.getElementById('preloader');
    const num = document.getElementById('pre-num');
    const fill = document.getElementById('pre-fill') as HTMLElement | null;

    if (pre && num && fill) {
      if (location.hash === '#skip') {
        pre.classList.add('done');
        document.body.classList.remove('loading');
        document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'));
        initReveal();
      } else {
        let p = 0;
        const tick = () => {
          p += Math.max(1.5, (100 - p) * 0.085 + Math.random() * 4);
          if (p >= 100) p = 100;
          num.textContent = String(Math.floor(p));
          fill.style.right = 100 - p + '%';
          if (p < 100) {
            preloaderTimeout = setTimeout(tick, 45 + Math.random() * 70);
          } else {
            preloaderTimeout = setTimeout(() => {
              pre.classList.add('done');
              document.body.classList.remove('loading');
              initReveal();
            }, 420);
          }
        };
        tick();
      }
    }

    // ── duplicate marquee ────────────────────────────────────
    const track = document.getElementById('marq');
    if (track) track.innerHTML += track.innerHTML;

    // ── hero canvas: flowing wave field ──────────────────────
    const canvas = canvasRef.current;
    const onResize = () => {};
    const onMouseMove = (_e: MouseEvent) => {};

    if (canvas) {
      const ctx = canvas.getContext('2d')!;
      let w = 0, h = 0, dpr = 1;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      let mx = 0.5, my = 0.5;

      const handleResize = () => {
        dpr = Math.min(devicePixelRatio || 1, 2);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      handleResize();
      window.addEventListener('resize', handleResize);

      const handleMouseMove = (e: MouseEvent) => {
        mx = e.clientX / innerWidth;
        my = e.clientY / innerHeight;
      };
      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      const waves = [
        { amp: 60,  freq: 0.0016, speed:  0.6, y: 0.62, col: 'rgba(140,235,175,0.55)', lw: 1.6 },
        { amp: 90,  freq: 0.0011, speed: -0.4, y: 0.66, col: 'rgba(140,235,175,0.16)', lw: 1.2 },
        { amp: 40,  freq: 0.0026, speed:  0.9, y: 0.58, col: 'rgba(255,255,255,0.10)', lw: 1   },
        { amp: 120, freq: 0.0008, speed:  0.3, y: 0.70, col: 'rgba(120,170,255,0.10)', lw: 1.2 },
      ];

      let t = 0;
      const frame = () => {
        t += 1;
        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(255,255,255,0.025)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= w; x += 80) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }

        waves.forEach((wv, idx) => {
          ctx.beginPath();
          ctx.strokeStyle = wv.col;
          ctx.lineWidth = wv.lw;
          const baseY = h * wv.y + (my - 0.5) * 40 * (idx + 1) * 0.3;
          for (let x = 0; x <= w; x += 6) {
            const m = (1 - Math.abs(x / w - mx)) * 26;
            const y =
              baseY +
              Math.sin(x * wv.freq + t * 0.01 * wv.speed * 3) * (wv.amp + m) +
              Math.sin(x * wv.freq * 2.3 + t * 0.02) * (wv.amp * 0.25);
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        });

        const wv0 = waves[0];
        for (let k = 0; k < 3; k++) {
          const px = ((t * (1.4 + k * 0.6)) % (w + 80)) - 40;
          const baseY = h * wv0.y + (my - 0.5) * 12;
          const py = baseY + Math.sin(px * wv0.freq + t * 0.03) * wv0.amp;
          ctx.beginPath();
          ctx.fillStyle = `rgba(160,245,190,${0.9 - k * 0.25})`;
          ctx.arc(px, py, 2.4 - k * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        if (!reduce) rafId = requestAnimationFrame(frame);
      };
      frame();

      // ── FAQ accordion (event delegation) ──────────────────
      const faqGrid = document.getElementById('faq-grid');
      if (faqGrid) {
        const faqClick = (e: Event) => {
          const card = (e.target as HTMLElement).closest<HTMLElement>('.qa');
          if (!card) return;
          const stack = card.closest<HTMLElement>('.qa-stack');
          if (!stack) return;
          const wasOpen = stack.classList.contains('is-open');
          faqGrid.querySelectorAll<HTMLElement>('.qa-stack.is-open').forEach((s) => {
            s.classList.remove('is-open');
            const c = s.querySelector<HTMLElement>('.qa');
            if (c) { c.setAttribute('aria-expanded', 'false'); c.style.minHeight = ''; }
          });
          if (!wasOpen) {
            stack.classList.add('is-open');
            card.setAttribute('aria-expanded', 'true');
            const panel = stack.querySelector<HTMLElement>('.qa-panel');
            if (panel) card.style.minHeight = Math.max(200, Math.ceil(panel.scrollHeight)) + 'px';
          }
        };
        faqGrid.addEventListener('click', faqClick);
      }

      return () => {
        clearTimeout(preloaderTimeout);
        cancelAnimationFrame(rafId);
        revealObs?.disconnect();
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        document.body.classList.remove('loading');
      };
    }

    return () => {
      clearTimeout(preloaderTimeout);
      cancelAnimationFrame(rafId);
      revealObs?.disconnect();
      document.body.classList.remove('loading');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* ── PRELOADER ─────────────────────────────────────── */}
      <div id="preloader">
        <div className="pre-top">
          <div className="mono">Loading<br />Portfolio</div>
          <div className="pre-wave" id="pre-wave" />
        </div>
        <div>
          <div className="pre-count">
            <span id="pre-num">0</span><sup>%</sup>
          </div>
          <div className="pre-bar"><i id="pre-fill" /></div>
        </div>
        <div className="pre-bottom">
          <div className="mono">
            Coff<span style={{ color: 'var(--accent)', marginLeft: '-0.36em' }}>₹</span>© 2026
          </div>
        </div>
      </div>

      {/* ── NAV ───────────────────────────────────────────── */}
      <header className="nav">
        <a className="brand" href="#top">
          <span className="dot" />
          Coff<span style={{ color: 'var(--accent)', fontWeight: 500, marginLeft: '-0.36em' }}>₹</span>
        </a>
        <nav className="links">
          <a href="#work">Features</a>
          <a href="#how">How it works</a>
          <a href="#engine">Engine</a>
          <a href="#faq">FAQ</a>
          <a href="/login">Login</a>
        </nav>
      </header>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="hero" id="top">
        <canvas id="hero-canvas" ref={canvasRef} />
        <div className="wrap">
          <h1 className="hero-head reveal in" data-d="1">
            See every<br />
            <em>
              <span style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontWeight: 600, marginRight: '-0.04em' }}>₹</span>upee
            </em>
            <br />at work
          </h1>
          <p className="hero-tag reveal in" data-d="1">
            Portfolio tracking built for Indian markets.
          </p>
          <div className="hero-foot reveal in" data-d="2">
            <p>
              Coffer follows equities, ETFs and mutual funds on NSE &amp; BSE — computing
              FIFO cost basis, tax liability, TWR and XIRR from your transactions alone.
            </p>
            <a className="btn solid" href="/login">Login <span className="arr">↗</span></a>
          </div>
        </div>
        <div className="scroll-cue">
          <span>Scroll</span>
          <span className="line" />
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────── */}
      <div className="marquee">
        <div className="marquee-track" id="marq">
          <span>Equities</span><span>ETFs</span><span>Mutual Funds</span>
          <span>NSE</span><span>BSE</span><span>FIFO</span>
          <span>XIRR</span><span>STCG</span><span>LTCG</span>
        </div>
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────── */}
      <section className="section-pad">
        <div className="wrap">
          <p
            className="eyebrow reveal"
            style={{ marginBottom: 48, display: 'flex', justifyContent: 'center' }}
          >
            — Overview —
          </p>
          <div className="spec-grid">
            <p className="lead reveal">
              Coffer turns a stream of <em>transactions</em> into an accurate,
              tax-aware picture of <em>everything you hold</em> — across brokers,
              in one place, in ₹.
            </p>
            <div className="spec-side reveal" data-d="1">
              <p>
                Holdings are derived from your ledger rather than stored, so
                valuations, cost basis and gains always reconcile to what you
                actually did. Equities, ETFs and listed funds on NSE and BSE,
                priced end-of-day.
              </p>
              <div className="spec-cta">
                <a className="btn" href="/login">Login <span className="arr">↗</span></a>
                <a className="btn ghost" href="#work">See features <span className="arr">↓</span></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <section className="section-pad" id="work">
        <div className="wrap">
          <div className="section-head">
            <h2 className="big-statement reveal">
              Built for how <em>Indian portfolios</em> actually work
            </h2>
            <div className="cases-meta reveal" data-d="1">
              <a href="/dashboard">Live demo ↗</a>
              <a href="/login">Sign in ↗</a>
              <span>Equities · ETFs · <strong style={{ color: 'var(--fg)' }}>Mutual funds</strong></span>
            </div>
          </div>
          <div className="case-grid">
            {CASES.map((c, i) => (
              <a key={i} className="case reveal" data-d={String(i % 2)} href={c.href}>
                <div className="case-thumb">
                  <div className="case-tags">
                    {c.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <div className="ph"><span>{c.ph}</span></div>
                </div>
                <div className="case-body">
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                  <span className="case-link">View case <span className="arr">↗</span></span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="section-pad" id="how">
        <div className="wrap">
          <p
            className="eyebrow reveal"
            style={{ marginBottom: 48, display: 'flex', justifyContent: 'center' }}
          >
            — How it works —
          </p>
          <div id="xp-list">
            {EXPERIENCE.map((x, i) => (
              <div key={i} className="xp-row reveal">
                <div className="yr">{x.yr}</div>
                <div className="role">
                  <h4>{x.role}</h4>
                  <div className="co">{x.co}</div>
                </div>
                <div className="desc">{x.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENGINE ────────────────────────────────────────── */}
      <section className="section-pad" id="engine">
        <div className="wrap">
          <p
            className="eyebrow reveal"
            style={{ marginBottom: 48, display: 'flex', justifyContent: 'center' }}
          >
            — The finance engine —
          </p>
          <div className="skills-grid">
            {SKILLS.map((s, i) => (
              <div key={i} className="skill reveal" data-d={String(i % 3)}>
                <div className="idx">{String(i + 1).padStart(2, '0')}</div>
                <h4>{s.t}</h4>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="section-pad" id="faq">
        <div className="wrap">
          <p
            className="eyebrow reveal"
            style={{ marginBottom: 48, display: 'flex', justifyContent: 'center' }}
          >
            — FAQ —
          </p>
          <div className="faq-grid" id="faq-grid">
            {FAQ_ITEMS.map((f, i) => (
              <div key={i} className="qa-stack reveal" data-d={String(i % 2)}>
                <span className="qa-back" aria-hidden="true" />
                <button className="qa" type="button" aria-expanded="false">
                  <span className="qa-face">
                    <span className="qa-idx">{String(i + 1).padStart(2, '0')}</span>
                    <span className="qa-q">{f.q}</span>
                    <span className="qa-plus" aria-hidden="true" />
                  </span>
                  <span className="qa-panel">
                    <span className="qa-x" aria-hidden="true" />
                    <span className="qa-panel-label">{f.q}</span>
                    <span className="qa-a">{f.a}</span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ───────────────────────────────────────── */}
      <section className="contact" id="contact">
        <div className="wrap">
          <h2 className="reveal" data-d="1">
            See your<br />portfolio <a href="/login">clearly ↗</a>
          </h2>
          <div className="cta-row reveal" data-d="3">
            <a className="btn solid" href="/login">Login <span className="arr">↗</span></a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="foot">
        <div className="mono">
          Coff<span style={{ color: 'var(--accent)', marginLeft: '-0.36em' }}>₹</span>© — Investment portfolio tracker · NSE / BSE / Mutual funds
        </div>
        <div className="foot-links">
          <a href="/login">Login</a>
          <a href="/dashboard">Dashboard</a>
          <a href="#work">Features</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="mono">Built 2026 · All values in ₹ (INR)</div>
      </footer>
    </>
  );
}
