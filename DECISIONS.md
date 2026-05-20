# Architecture Decisions

## D-001: CSV Import Preview Uses In-Memory Dict

**Decision:** Preview data from CSV uploads is staged in a Python dict in process memory (not Redis or a DB temp table).

**Reason:** Single-user MVP. Redis adds infrastructure complexity; a temp DB table adds schema complexity. Process-memory staging is perfectly safe for one concurrent user.

**Trade-off:** Preview is lost on backend restart. Acceptable for MVP; add Redis staging if multi-user or reliability is needed.

---

## D-002: Performance Calculated on Full Portfolio (Not Per Account)

**Decision:** TWR and XIRR are computed across all accounts for a given user, not per account.

**Reason:** Spec says "computed for the portfolio". Splitting by account would require multiple calls and complicate the UI. Log as limitation.

---

## D-003: SELL Fees Reduce Cash Proceeds

**Decision:** For SELL transactions, `fees` are subtracted from cash proceeds:
`cash += (qty × price) − fees`

**Reason:** Spec states "SELL proceeds" without explicit fee treatment for sells but subtracts fees for BUY. Most realistic interpretation: fees always reduce cash position regardless of direction.

---

## D-004: SPLIT Transaction Convention

**Decision:** For SPLIT transactions, `quantity` = new shares per old share (split ratio), `price` = 0.

**Reason:** The transaction schema must encode the ratio. Using `quantity` is the most natural field. Documented in README and CSV format spec.

---

## D-005: Price Staleness Threshold = 2 Days

**Decision:** A price is considered stale if the price date is more than 2 calendar days before `as_of`.

**Reason:** Markets are closed on weekends; a Friday price on Monday would be 3 days old which is expected. Threshold of 2 days tolerates weekends without false positives on Friday prices. (Note: a 3-day threshold was also considered but 2 days is more conservative.)

---

## D-006: No Sharpe, Benchmark, Volatility

**Decision:** Explicitly excluded per spec. See Out of Scope section in `requirement.md`.

---

## D-007: XIRR Uses External Cash Flows Only

**Decision:** XIRR cash flows = DEPOSIT (negative, outflow) and WITHDRAWAL (positive, inflow) only. The final portfolio value is appended as a positive terminal cash flow.

**Reason:** XIRR measures the return on capital deployed from outside the portfolio. Internal reinvestment (dividends, sells reinvested) are already captured in the ending portfolio value.

---

## D-008: nightly_price_fetch Runs at 03:00 UTC

**Decision:** Scheduler fires at 03:00 UTC, which covers 22:00 ET for both EST (UTC-5) and EDT (UTC-4).

**Reason:** Using a single UTC time avoids DST complexity with APScheduler's cron trigger.
