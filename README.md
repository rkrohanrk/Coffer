# Personal Portfolio Management System

Single-user, USD-only investment portfolio tracker. Tracks equities and ETFs, computes FIFO cost basis, TWR (Modified Dietz), and XIRR.

## Quick Start

```bash
docker compose up --build
```

Then open http://localhost:3000. Default credentials: `admin@example.com` / `password123`.

The seed script runs automatically on first boot and populates 2 accounts, 5 assets, and ~20 transactions so the dashboard is non-empty.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and update as needed.

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async PostgreSQL URL |
| `SECRET_KEY` | *(required)* | JWT signing key (`openssl rand -hex 32`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | JWT expiry |
| `ADMIN_EMAIL` | `admin@example.com` | Seed user email |
| `ADMIN_PASSWORD` | `password123` | Seed user password |

## CSV Import Format

Required columns (case-insensitive): `date`, `account`, `symbol`, `type`, `quantity`, `price`, `fees`
Optional: `notes`

```csv
date,account,symbol,type,quantity,price,fees,notes
2024-01-15,Brokerage,AAPL,BUY,100,150.00,5.00,Initial position
2024-03-01,Brokerage,,DEPOSIT,5000,1,0,
2024-06-01,Brokerage,AAPL,SELL,50,180.00,5.00,
2024-09-01,Brokerage,AAPL,SPLIT,2,0,0,2:1 split
```

**Rules:**
- `account` must match an existing account name (case-insensitive)
- `symbol` must match an existing asset symbol (add assets via API or UI first)
- For SPLIT: `quantity` = new shares per old share (e.g., `2` for 2:1); `price` = 0
- For DEPOSIT/WITHDRAWAL: `quantity` = dollar amount; `symbol` can be blank
- Import is **all-or-nothing**: if any row fails validation, no rows are inserted

## API

OpenAPI docs available at http://localhost:8000/docs

Key endpoints:
```
POST /api/v1/auth/login
GET  /api/v1/holdings?as_of=YYYY-MM-DD
GET  /api/v1/transactions?page=1&size=50&account_id=...&type=BUY
GET  /api/v1/performance?as_of=YYYY-MM-DD
GET  /api/v1/allocation?group_by=asset_class|sector
POST /api/v1/import/csv               → preview_id
POST /api/v1/import/csv/{id}/commit
POST /api/v1/prices/refresh
```

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest --cov=app/lib --cov=app/services --cov-report=term-missing
```

## Architecture

```
backend/app/
  lib/finance/   — pure math: FIFO, XIRR, Modified Dietz (no I/O)
  services/      — business logic: holdings engine, performance, pricing, import
  api/v1/        — FastAPI routers
  models/        — SQLAlchemy ORM
  schemas/       — Pydantic v2 request/response
  providers/     — PriceProvider interface + yfinance implementation
  jobs/          — APScheduler nightly price fetch (22:00 ET)
```

Holdings are **always derived from transactions** — there is no direct holdings table. FIFO cost basis is computed on every request from the raw transaction log.

## Known Limitations

See `DECISIONS.md` for all deviations from spec.
- Prices are end-of-day only; no real-time data
- Performance calculations use portfolio-level Modified Dietz (not sub-account)
- CSV import preview stored in process memory (lost on restart)
