"""CSV import: parse → preview → commit (all-or-nothing) via Supabase."""
import io
import uuid
from datetime import date
from decimal import Decimal, InvalidOperation

import pandas as pd
from supabase import AsyncClient

REQUIRED_COLUMNS = {"date", "account", "symbol", "type", "quantity", "price", "fees"}
VALID_TYPES = {"BUY", "SELL", "DIVIDEND", "SPLIT", "DEPOSIT", "WITHDRAWAL"}

_previews: dict[str, list[dict]] = {}


class ImportError(Exception):
    pass


def parse_csv(content: bytes) -> list[dict]:
    try:
        df = pd.read_csv(io.BytesIO(content), dtype=str)
    except Exception as exc:
        raise ImportError(f"Cannot parse CSV: {exc}") from exc

    df.columns = df.columns.str.strip().str.lower()
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ImportError(f"Missing columns: {', '.join(sorted(missing))}")

    rows = []
    for i, row in df.iterrows():
        tx_type = str(row["type"]).strip().upper()
        if tx_type not in VALID_TYPES:
            raise ImportError(f"Row {i+2}: invalid type '{tx_type}'")
        rows.append({
            "date": str(row["date"]).strip(),
            "account": str(row["account"]).strip(),
            "symbol": str(row.get("symbol", "")).strip().upper() or None,
            "type": tx_type,
            "quantity": str(row["quantity"]).strip(),
            "price": str(row.get("price", "0")).strip() or "0",
            "fees": str(row.get("fees", "0")).strip() or "0",
            "notes": str(row.get("notes", "")).strip() or None,
        })
    return rows


async def stage_preview(content: bytes) -> tuple[str, list[dict]]:
    rows = parse_csv(content)
    preview_id = str(uuid.uuid4())
    _previews[preview_id] = rows
    return preview_id, rows


async def commit_preview(preview_id: str, db: AsyncClient) -> int:
    rows = _previews.get(preview_id)
    if rows is None:
        raise ImportError("Preview not found or expired")

    acct_result = await db.table("accounts").select("id,name").execute()
    accounts = {r["name"].lower(): r["id"] for r in acct_result.data}

    asset_result = await db.table("assets").select("id,symbol").execute()
    assets = {r["symbol"].upper(): r["id"] for r in asset_result.data}

    payloads = []
    for i, row in enumerate(rows):
        acct_id = accounts.get(row["account"].lower())
        if not acct_id:
            raise ImportError(f"Row {i+1}: unknown account '{row['account']}'")

        asset_id = None
        if row["symbol"] and row["type"] not in ("DEPOSIT", "WITHDRAWAL"):
            asset_id = assets.get(row["symbol"])
            if not asset_id:
                raise ImportError(f"Row {i+1}: unknown symbol '{row['symbol']}'. Add the asset first.")

        try:
            trade_date = date.fromisoformat(row["date"])
            quantity = Decimal(row["quantity"])
            price = Decimal(row["price"])
            fees = Decimal(row["fees"])
        except (ValueError, InvalidOperation) as exc:
            raise ImportError(f"Row {i+1}: {exc}") from exc

        payloads.append({
            "account_id": acct_id,
            "asset_id": asset_id,
            "type": row["type"],
            "trade_date": trade_date.isoformat(),
            "quantity": str(quantity),
            "price": str(price),
            "fees": str(fees),
            "notes": row["notes"],
        })

    # All-or-nothing: insert all at once
    await db.table("transactions").insert(payloads).execute()
    del _previews[preview_id]
    return len(payloads)
