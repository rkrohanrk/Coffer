"""Seed script: creates demo user, 2 accounts, 5 Indian assets, 20 transactions."""
import asyncio
import os
from datetime import date
from decimal import Decimal

from supabase import AClient as AsyncClient, acreate_client as create_async_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


async def seed() -> None:
    from app.auth import hash_password

    db: AsyncClient = await create_async_client(SUPABASE_URL, SUPABASE_KEY)

    # Check if already seeded
    existing = await db.table("users").select("id").limit(1).execute()
    if existing.data:
        print("Already seeded, skipping.")
        return

    email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    password = os.environ.get("ADMIN_PASSWORD", "password123")

    # User
    u = await db.table("users").insert({"email": email, "password_hash": hash_password(password)}).execute()
    user_id = u.data[0]["id"]

    # Accounts
    accts = await db.table("accounts").insert([
        {"user_id": user_id, "name": "Zerodha", "type": "BROKERAGE", "institution": "Zerodha"},
        {"user_id": user_id, "name": "Groww MF", "type": "RETIREMENT", "institution": "Groww"},
    ]).execute()
    brokerage_id = accts.data[0]["id"]
    mf_id = accts.data[1]["id"]

    # Assets — Indian symbols
    assets_data = [
        ("RELIANCE.NS",  "Reliance Industries Ltd",      "EQUITY", "Energy"),
        ("INFY.NS",      "Infosys Ltd",                  "EQUITY", "Technology"),
        ("HDFCBANK.NS",  "HDFC Bank Ltd",                "EQUITY", "Finance"),
        ("NIFTYBEES.NS", "Nippon India ETF Nifty BeES",  "ETF",    None),
        ("GOLDBEES.NS",  "Nippon India ETF Gold BeES",   "ETF",    None),
    ]
    a_result = await db.table("assets").insert([
        {"symbol": s, "name": n, "asset_class": c, "sector": sec}
        for s, n, c, sec in assets_data
    ]).execute()
    am = {r["symbol"]: r["id"] for r in a_result.data}

    def tx(acct_id, symbol, tx_type, d, qty, price, fees=0, notes=None):
        return {
            "account_id": acct_id,
            "asset_id": am.get(symbol),
            "type": tx_type,
            "trade_date": d.isoformat(),
            "quantity": str(Decimal(str(qty))),
            "price": str(Decimal(str(price))),
            "fees": str(Decimal(str(fees))),
            "notes": notes,
        }

    def cash(acct_id, tx_type, d, amount):
        return {
            "account_id": acct_id,
            "asset_id": None,
            "type": tx_type,
            "trade_date": d.isoformat(),
            "quantity": str(Decimal(str(amount))),
            "price": "1",
            "fees": "0",
            "notes": None,
        }

    transactions = [
        cash(brokerage_id, "DEPOSIT",   date(2023, 1, 2),  200000),
        cash(brokerage_id, "DEPOSIT",   date(2023, 7, 1),   50000),
        tx(brokerage_id, "RELIANCE.NS", "BUY",  date(2023, 1, 5),  10, 2450.00, 25),
        tx(brokerage_id, "INFY.NS",     "BUY",  date(2023, 1, 10), 20, 1520.00, 25),
        tx(brokerage_id, "NIFTYBEES.NS","BUY",  date(2023, 2, 1),  50, 190.00,  15),
        tx(brokerage_id, "HDFCBANK.NS", "BUY",  date(2023, 3, 15), 15, 1620.00, 25),
        tx(brokerage_id, "GOLDBEES.NS", "BUY",  date(2023, 4, 10), 30, 520.00,  15),
        tx(brokerage_id, "RELIANCE.NS", "BUY",  date(2023, 7, 5),   5, 2750.00, 25),
        tx(brokerage_id, "INFY.NS",     "SELL", date(2023, 9, 15), 10, 1800.00, 25),
        tx(brokerage_id, "RELIANCE.NS", "DIVIDEND", date(2023, 11, 15), 15, 9.0),
        tx(brokerage_id, "NIFTYBEES.NS","BUY",  date(2024, 1, 10), 30, 215.00,  15),
        tx(brokerage_id, "HDFCBANK.NS", "SELL", date(2024, 3, 1),   5, 1720.00, 25),
        cash(mf_id, "DEPOSIT",          date(2023, 1, 15), 50000),
        cash(mf_id, "DEPOSIT",          date(2024, 1, 15), 50000),
        tx(mf_id, "NIFTYBEES.NS",       "BUY",  date(2023, 1, 20), 100, 188.00, 0),
        tx(mf_id, "GOLDBEES.NS",        "BUY",  date(2023, 6, 1),   50, 530.00, 0),
        tx(mf_id, "NIFTYBEES.NS",       "BUY",  date(2024, 1, 22),  50, 218.00, 0),
        tx(brokerage_id, "INFY.NS",     "BUY",  date(2024, 2, 1),   10, 1740.00, 25),
        tx(brokerage_id, "RELIANCE.NS", "BUY",  date(2024, 3, 10),   5, 2950.00, 25),
        tx(brokerage_id, "HDFCBANK.NS", "SELL", date(2024, 6, 1),    5, 1780.00, 25),
    ]

    await db.table("transactions").insert(transactions).execute()
    print(f"Seeded: user={email}, 2 accounts, 5 assets, {len(transactions)} transactions")


if __name__ == "__main__":
    asyncio.run(seed())
