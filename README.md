# Coffer — An Investment Portfolio Tracker

Multi-user investment portfolio management system built for Indian markets. Tracks equities, ETFs, and mutual funds listed on NSE/BSE. Computes FIFO cost basis, STCG/LTCG tax liability, TWR (Modified Dietz), and XIRR — all in INR.

Each user manages their own accounts, holdings, and transactions in complete isolation.

---

## Quick Start

```bash
docker compose up --build
```

Open http://localhost:3000 and register a new account, or use the seeded demo:
- Email: `investor@coffer.in`
- Password: `vault2026`

The login form is prefilled with these credentials. Running `backend/supabase/seed.sql`
(see below) creates this real Supabase Auth user and populates demo data so the
dashboard is non-empty.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env`.

| Variable | Default | Description |
|---|---|---|
| `SUPABASE_URL` | *(required)* | Supabase project URL (also used to verify auth JWTs via JWKS) |
| `SUPABASE_SERVICE_KEY` | *(required)* | Supabase service role key (server-side only) |
| `SUPABASE_JWT_SECRET` | *(optional)* | Only for legacy projects that sign access tokens with HS256 |
| `ENVIRONMENT` | `development` | Set to `production` for production behaviour |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | *(optional)* | Only used by the legacy `seed.py` script |

The frontend needs `frontend/.env.local` (copy `frontend/.env.local.example`):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE` | Base URL of the FastAPI backend |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key (safe to expose) |

---

## Authentication (Supabase Auth)

Auth runs **client-side** via Supabase Auth (`@supabase/ssr`). The Next.js app owns
the session (stored in cookies); FastAPI no longer logs anyone in — it only
**verifies** the Supabase access token sent as `Authorization: Bearer <jwt>` and
derives the user from it.

**One-time setup**

1. Apply the schema: run `backend/supabase/schema.sql` in the Supabase SQL Editor.
2. Seed the demo user + data: run `backend/supabase/seed.sql` in the SQL Editor.
   This creates the confirmed user `investor@coffer.in` / `vault2026`.
3. Set the frontend env vars above, then `npm run dev` in `frontend/`.

**Flows wired to Supabase Auth**

- Sign in → `signInWithPassword`
- Sign up → `signUp` (shows a "confirm your email" toast when confirmation is required)
- Forgot password → `resetPasswordForEmail`, returning to `/reset-password`
  (`updateUser` sets the new password)
- Route guard → `middleware.ts` refreshes the session and redirects unauthenticated
  users away from `/dashboard`
- Sign out → `supabase.auth.signOut` (`signOut()` helper in `frontend/lib/auth.ts`)

> Email sign-up/reset require email delivery to be configured in the Supabase
> dashboard (Auth → Providers / Email). The seeded demo user is pre-confirmed, so
> the prefilled login works without email setup.

---

## CSV Import Format

Required columns: `date`, `account`, `symbol`, `type`, `quantity`, `price`, `fees`
Optional: `notes`

```csv
date,account,symbol,type,quantity,price,fees,notes
2024-01-15,Zerodha,RELIANCE.NS,BUY,10,2450.00,20.00,Initial position
2024-03-01,Zerodha,,DEPOSIT,50000,1,0,Monthly SIP funds
2024-06-01,Zerodha,RELIANCE.NS,SELL,5,2800.00,20.00,Partial exit
2024-09-01,Zerodha,HDFCBANK.NS,BUY,20,1600.00,20.00,
```

**Rules:**
- `account` must match an existing account name (case-insensitive)
- `symbol` must match an existing asset symbol. Use NSE suffix `.NS` or BSE suffix `.BO`
- For SPLIT: `quantity` = new shares per old share; `price` = 0
- For DEPOSIT/WITHDRAWAL: `quantity` = INR amount; `symbol` can be blank
- Import is **all-or-nothing** — any validation error cancels the entire file

---

## API

OpenAPI docs: http://localhost:8000/docs

```
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me

GET    /api/v1/accounts
POST   /api/v1/accounts
GET    /api/v1/accounts/{id}
PATCH  /api/v1/accounts/{id}
DELETE /api/v1/accounts/{id}

GET  /api/v1/assets
POST /api/v1/assets

GET    /api/v1/transactions?page=1&size=50&account_id=...&type=BUY
POST   /api/v1/transactions
DELETE /api/v1/transactions/{id}

GET  /api/v1/holdings?as_of=YYYY-MM-DD
GET  /api/v1/performance?as_of=YYYY-MM-DD
GET  /api/v1/allocation?group_by=asset_class|sector

POST /api/v1/import/csv
POST /api/v1/import/csv/{id}/commit
POST /api/v1/prices/refresh
```

---

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest --cov=app/lib --cov=app/services --cov-report=term-missing
```

---

## Architecture

```
backend/app/
  lib/finance/   — pure math: FIFO, XIRR, Modified Dietz
  services/      — holdings engine, performance, pricing, import
  api/v1/        — FastAPI routers (all scoped to authenticated user)
  schemas/       — Pydantic v2 request/response (no ORM — Supabase client used directly)
  providers/     — PriceProvider interface + yfinance impl
  jobs/          — APScheduler nightly fetch at 16:03 UTC (21:33 IST) weekdays
  db/            — shared async Supabase client
  auth.py        — JWT encode/decode + bcrypt
  config.py      — pydantic-settings (reads backend/.env)
  dependencies.py — get_current_user FastAPI dependency
```

Holdings derived from transactions — no separate holdings table.
All user data is isolated by `user_id` on every DB query.

---

## Known Limitations (Current v1)

- Prices end-of-day only; no real-time or intraday data
- Performance calculated at portfolio level, not per account
- CSV preview stored in process memory (lost on backend restart)
- Single currency (INR) — no FX conversion
- No mutual fund NAV support yet (only NSE/BSE-listed securities via yfinance)

---

## Roadmap — Changes Required to Reach Full India Multi-User Vision

### 1. Multi-User: Registration + User Isolation

**Status:** Auth exists (login/logout/JWT). Missing: open registration.

**Changes needed:**
- `POST /api/v1/auth/register` — new endpoint, hash password, create User row
- Frontend: add Register page linked from Login
- All existing API routes already scope to `current_user.id` — no changes needed there
- Seed script: create multiple demo users instead of one hard-coded admin
- Rate-limit registration endpoint (e.g., 5 req/IP/hour) to prevent abuse

**Files:** `backend/app/api/v1/auth.py`, `frontend/app/login/page.tsx` (add register form)

---

### 2. Currency: USD → INR

**Status:** All math uses `Decimal` correctly. Display layer hardcodes `$`.

**Changes needed:**
- `frontend/lib/finance/decimal.ts` — change `$` to `₹` in `fmtCurrency()`
- `backend/.env` — add `CURRENCY=INR` env var (for OpenAPI docs / export labels)
- Seed data — replace AAPL/MSFT/SPY with RELIANCE.NS, INFY.NS, HDFCBANK.NS, NIFTY50ETF.NS
- CSV import docs and example — update to use Indian symbols
- README CSV example — already updated above

**Files:** `frontend/lib/finance/decimal.ts`, `backend/seed.py`

---

### 3. Indian Market Price Provider (NSE/BSE via yfinance)

**Status:** yfinance provider exists but configured for US tickers.

**Changes needed:**
- yfinance supports `.NS` (NSE) and `.BO` (BSE) suffixes natively — no provider code change
- Add `exchange` field to `Asset` model (`NSE` | `BSE` | `OTHER`) and auto-append suffix when fetching
- Change nightly scheduler cron from `03:00 UTC` to `16:03 UTC` (21:33 IST — 3 min after NSE close at 15:30 IST) and run weekdays only
- Add validation: warn if symbol doesn't end in `.NS` or `.BO` when asset_class is EQUITY/ETF

**Files:** `backend/app/models/asset.py`, `backend/app/providers/yfinance_provider.py`, `backend/app/jobs/price_fetch.py`, `backend/app/db/alembic/versions/002_add_exchange.py`

---

### 4. Indian Capital Gains Tax (STCG / LTCG)

**Status:** Not implemented. Pure P&L only.

**Changes needed:**
- New file: `backend/app/lib/finance/tax.py`
  - Classify each SELL lot as STCG (held < 12 months for equity/ETF) or LTCG (≥ 12 months)
  - STCG rate: 20% (post-Jul 2024 Budget)
  - LTCG rate: 12.5% on gains above ₹1.25 lakh exemption per FY (post-Jul 2024 Budget)
  - Mutual funds (debt): slab rate regardless of holding period
- New endpoint: `GET /api/v1/tax?fy=2024-25`
  - Returns: STCG total, LTCG total, LTCG exempt portion, estimated tax liability
- New frontend page: Tax Summary (per financial year Apr–Mar)
- Tests: acceptance tests for STCG/LTCG boundary at exactly 12 months

**Files:** `backend/app/lib/finance/tax.py` (new), `backend/app/services/tax.py` (new), `backend/app/api/v1/tax.py` (new), `frontend/app/dashboard/tax/page.tsx` (new)

---

### 5. Mutual Fund Support (NAV-based)

**Status:** Only NSE/BSE-listed securities supported.

**Changes needed:**
- Add `MUTUAL_FUND` to `asset_class` enum in Asset model and transaction validation
- Add `isin` and `amfi_code` fields to Asset model (AMFI is the Indian MF regulator)
- New provider: `MFAPIProvider` — fetches NAV from `https://api.mfapi.in/mf/{amfi_code}` (free, no key)
  - Implement `PriceProvider` interface
  - Falls back to yfinance for listed ETFs
- Nightly job: fetch NAV for all MUTUAL_FUND assets via MFAPI
- Units terminology: MFs use "units" not "shares" — handle in UI display
- SIP import: support recurring BUY rows in CSV

**Files:** `backend/app/providers/mfapi_provider.py` (new), `backend/app/models/asset.py`, `backend/app/db/alembic/versions/003_add_mf_fields.py`

---

### 6. Indian Broker Account Types

**Status:** Only `BROKERAGE` and `RETIREMENT` types.

**Changes needed:**
- Extend `account_type` enum:
  - `DEMAT` — standard equity/ETF account (Zerodha, Groww, Upstox, etc.)
  - `MF_FOLIO` — mutual fund folio (non-demat)
  - `PPF` — Public Provident Fund (fixed interest, 15-year lock-in)
  - `NPS` — National Pension System
  - `RETIREMENT` — keep for 401k-equivalent (EPF)
- New Alembic migration for updated enum
- Frontend account creation form — updated type dropdown with Indian labels

**Files:** `backend/app/models/account.py`, `backend/app/db/alembic/versions/004_update_account_types.py`, `frontend/app/dashboard/transactions/page.tsx`

---

### 7. Financial Year Aware Reporting (Apr–Mar)

**Status:** YTD period uses Jan 1. Wrong for India.

**Changes needed:**
- `backend/app/services/performance.py` — `_period_start("YTD")` → return `Apr 1` of current FY
  - FY logic: if today >= Apr 1, FY start = Apr 1 this year; else Apr 1 last year
- Tax summary page uses FY (Apr–Mar) bucketing
- Performance period labels: add `FY` alongside `YTD`

**Files:** `backend/app/services/performance.py`

---

### 8. Admin Panel (Multi-User Management)

**Status:** No admin functionality.

**Changes needed:**
- `is_admin` boolean flag on User model
- Admin-only endpoints:
  - `GET /api/v1/admin/users` — list all users
  - `DELETE /api/v1/admin/users/{id}` — delete user + cascade their data
- Middleware: check `is_admin` for `/api/v1/admin/*` routes
- Seed: first user created gets `is_admin=True`

**Files:** `backend/app/models/user.py`, `backend/app/api/v1/admin.py` (new), `backend/app/dependencies.py`

---

### 9. Production Hardening

**Changes needed:**
- Rate limiting: `slowapi` middleware on auth endpoints
- HTTPS: set `secure=True` on JWT cookie in production env
- CORS: restrict `allow_origins` to production domain
- CSV preview: move from in-memory dict to Redis or DB temp table (survives restarts)
- Pagination: add cursor-based pagination for large transaction sets
- Docker: add Redis service to `docker-compose.yml`
- CI: GitHub Actions — run pytest + mypy + eslint on every PR

**Files:** `docker-compose.yml`, `backend/app/main.py`, `backend/app/services/import_service.py`

---

### 10. Mobile-Responsive UI

**Status:** Dashboard uses basic Tailwind grid, not fully mobile-optimised.

**Changes needed:**
- Hamburger nav for mobile viewports
- Holdings table: collapse to card view on small screens
- Transaction form: full-screen sheet on mobile (shadcn `Sheet` component)
- Touch-friendly chart interactions (Recharts tooltips)
