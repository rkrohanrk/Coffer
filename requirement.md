# Build: Coffer — Personal Portfolio Management System (MVP)

## Role & Objective
You are a senior full-stack engineer. Build a **single-user, single-currency MVP** of an investment portfolio tracker. Scope is intentionally narrow: USD-only, equities + ETFs only, no crypto, no FX, no benchmarks, no advanced analytics. Get the core loop — log transactions, see correct holdings, see correct P&L — bulletproof before adding anything.

## Non-Negotiable Principles
1. **Money is never a float.** Use `Decimal` (Python) and `decimal.js` (JS). No `Number` for prices, quantities, or cash.
2. **Holdings are derived from transactions**, never edited directly. The transaction log is the source of truth.
3. **Timestamps are UTC** in storage, local TZ in display.
4. **No silent failures.** Surface price-fetch errors; flag stale data (threshold: 2 calendar days — see D-005).

## Tech Stack
- **Backend:** Python 3.12 + FastAPI + Pydantic v2
- **DB:** Supabase (hosted Postgres). `NUMERIC(20,8)` quantities, `NUMERIC(20,4)` money. Accessed via `supabase-py` async client — no SQLAlchemy ORM, no Alembic.
- **Frontend:** Next.js 14 (App Router) + TypeScript (strict) + TanStack Query + Tailwind + shadcn/ui + Recharts
- **Market data:** yfinance behind a `PriceProvider` interface (swappable)
- **Auth:** Single-user, JWT (httpOnly cookie). Admin credentials set via env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Supabase service key used server-side.
- **Testing:** pytest + pytest-asyncio (backend), Vitest (frontend). 80% coverage on `services/` and `lib/finance/`.
- **Tooling:** ruff, mypy --strict, eslint, prettier. No Docker Compose — Supabase is hosted.

## Out of Scope (Explicitly)
- Multiple currencies / FX conversion
- Crypto, bonds, mutual funds, options
- Benchmark comparison (SPY, etc.)
- Sharpe ratio, volatility, max drawdown
- Multi-user / sharing
- Mobile app
- Tax-lot specific identification (FIFO only)
- Real-time streaming quotes (end-of-day prices are fine)

## Data Model

```
User(id, email, password_hash, created_at)

Account(id, user_id, name, type[BROKERAGE|RETIREMENT], institution, created_at)

Asset(id, symbol, name, asset_class[EQUITY|ETF], sector, is_active)
  -- unique(symbol)

Transaction(id, account_id, asset_id, type, trade_date,
            quantity NUMERIC(20,8), price NUMERIC(20,4),
            fees NUMERIC(20,4), notes, created_at)
  -- type ∈ BUY, SELL, DIVIDEND, SPLIT, DEPOSIT, WITHDRAWAL
  -- SPLIT convention: quantity = new shares per old share (ratio), price = 0 (D-004)
  -- index(account_id, trade_date)

Price(id, asset_id, date, close NUMERIC(20,4), source, fetched_at)
  -- unique(asset_id, date)
```

5 tables. No FxRate, no Snapshot table for v1 (compute on the fly).

## Required Features

### 1. Accounts & Transactions
- CRUD for accounts and transactions via API + UI.
- CSV import: file upload → preview table → commit. One CSV format only (defined in README).
- Preview staged in-process memory dict (not Redis/DB temp table) — see D-001.
- Validation: SELL cannot exceed quantity held on trade date.

### 2. Holdings Engine (`services/holdings.py`)
- Pure function: `compute_holdings(transactions, as_of_date) -> list[Holding]`.
- **FIFO cost basis only** — no other methods in v1.
- Handle splits: adjust quantity & per-share cost basis, no P&L event. Ratio encoded in `quantity` field (D-004).
- Realized P&L computed at lot level on SELL.
- SELL fees reduce cash proceeds: `cash += (qty × price) − fees` (D-003).
- Cash balance per account = sum of (DEPOSIT − WITHDRAWAL − BUY cost − fees + SELL proceeds + DIVIDEND).

### 3. Pricing
- Nightly job (APScheduler) fires at **03:00 UTC** (covers 22:00 ET for EST/EDT, avoids DST complexity — D-008).
- "Refresh prices" button triggers same job on demand.
- Price is stale if date is >2 calendar days before `as_of` (tolerates weekends — D-005).
- If yfinance unreachable: show banner, use last cached close with timestamp visible.

### 4. Performance
- **TWR via Modified Dietz** for: 1M, 3M, YTD, 1Y, ALL.
- **XIRR** (Newton-Raphson + bisection fallback) for same periods.
- XIRR cash flows = DEPOSIT (outflow, negative) + WITHDRAWAL (inflow, positive) + terminal portfolio value. Internal reinvestment captured in ending value (D-007).
- Computed across **all accounts** for the user — not per account (D-002).
- No Sharpe, no benchmark, no volatility in v1 (D-006).

### 5. Dashboard (Next.js)
- **Top row:** total portfolio value, total cost basis, unrealized P&L (absolute + %), cash.
- **Holdings table:** symbol, name, quantity, avg cost, current price, market value, unrealized P&L, % of portfolio. Sortable.
- **Allocation donut:** by asset class (EQUITY vs ETF) and by sector.
- **Performance chart:** portfolio value over time, period toggle.
- **Transactions page:** paginated table, filterable by account/asset/type.

### 6. API
RESTful under `/api/v1/`. OpenAPI auto-generated.
```
GET  /accounts, /accounts/{id}
POST /accounts
POST /transactions          (single + batch)
GET  /transactions
GET  /holdings?as_of=YYYY-MM-DD
GET  /performance?period=1Y
GET  /allocation?group_by=asset_class|sector
POST /import/csv            (multipart → preview_id)
POST /import/csv/{preview_id}/commit
POST /prices/refresh
```

## Project Structure
```
backend/
  app/
    api/v1/        # routers
    services/      # holdings, performance, import, pricing
    lib/finance/   # pure math: xirr, twr, fifo
    schemas/       # Pydantic (no SQLAlchemy models — Supabase client used directly)
    providers/     # PriceProvider interface + yfinance impl
    jobs/          # APScheduler tasks
    db/            # supabase_client.py (shared async client)
    auth.py        # JWT logic
    config.py      # pydantic-settings (SUPABASE_URL, SUPABASE_SERVICE_KEY, SECRET_KEY, etc.)
    dependencies.py
    tests/
frontend/
  app/
    (auth)/        # login route group
    (dashboard)/   # protected route group
  components/
  lib/
requirements.txt
seed.py
README.md
DECISIONS.md
```

## Acceptance Tests (write first, TDD)
1. Buy 100 SHOP @ $50, sell 40 @ $80 → realized P&L = $1,200, remaining cost basis = $3,000 (FIFO).
2. 2:1 split on 100-share lot at $50 → 200 shares at $25 cost basis, no P&L event.
3. Two BUYs at different prices then a partial SELL consumes the oldest lot first (FIFO).
4. XIRR of [(-1000, day 0), (1100, day 365)] → 10.00% ± 0.01%.
5. Modified Dietz with mid-period $500 deposit returns the period return excluding the deposit's contribution.
6. SELL of more shares than held → API returns 400 with a clear message.
7. CSV import is all-or-nothing transactional.

## Build Order
1. Repo scaffold, pre-commit, CI skeleton (no Docker Compose — Supabase hosted).
2. Supabase schema + seed script: 1 user, 2 accounts, 20 transactions.
3. `lib/finance/` pure functions + tests (xirr, twr, FIFO, splits). **Rock-solid before anything else.**
4. Holdings service + tests (acceptance tests 1–3).
5. yfinance provider + nightly job.
6. API routes + OpenAPI export.
7. Frontend: auth → dashboard → holdings → transactions → import.
8. README with setup, env vars, CSV format spec, known limitations.

## Deliverables
- Single repo, runnable via `uvicorn app.main:app` (backend) + `npm run dev` (frontend).
- Seeded so dashboard is non-empty on first login.
- README + `DECISIONS.md` log for any deviations.

## How to Work
- **Plan first.** Output file tree, migration order, and any spec ambiguities. Wait for confirmation only on ambiguities — proceed otherwise.
- **Commit per logical unit**, conventional commit messages.
- **No TODOs in shipped code.** Out-of-scope items go in `DECISIONS.md`.
- **When the spec doesn't cover a decision**, pick the conservative interpretation, log it, continue.
