import uuid
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import AClient as AsyncClient

from app.db.supabase_client import get_supabase
from app.dependencies import get_current_user
from app.lib.finance.fifo import validate_sell
from app.schemas.transaction import TransactionCreate, TransactionPage, TransactionRead

router = APIRouter(prefix="/transactions", tags=["transactions"])


@dataclass
class _TxRow:
    type: str
    trade_date: date
    quantity: Decimal
    price: Decimal
    fees: Decimal


def _row_to_tx(row: dict) -> _TxRow:
    return _TxRow(
        type=row["type"],
        trade_date=date.fromisoformat(row["trade_date"]),
        quantity=Decimal(str(row["quantity"])),
        price=Decimal(str(row["price"])),
        fees=Decimal(str(row["fees"])),
    )


async def _user_account_ids(user: dict, db: AsyncClient) -> list[str]:
    result = await db.table("accounts").select("id").eq("user_id", user["id"]).execute()
    return [r["id"] for r in result.data]


@router.get("", response_model=TransactionPage)
async def list_transactions(
    account_id: uuid.UUID | None = Query(default=None),
    asset_id: uuid.UUID | None = Query(default=None),
    tx_type: str | None = Query(default=None, alias="type"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=50, ge=1, le=200),
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> TransactionPage:
    account_ids = await _user_account_ids(user, db)
    if not account_ids:
        return TransactionPage(items=[], total=0, page=page, size=size)

    q = db.table("transactions").select(
        "*, assets(symbol), accounts(name)", count="exact"
    ).in_("account_id", account_ids)

    if account_id:
        q = q.eq("account_id", str(account_id))
    if asset_id:
        q = q.eq("asset_id", str(asset_id))
    if tx_type:
        q = q.eq("type", tx_type.upper())

    q = q.order("trade_date", desc=True).order("created_at", desc=True)
    q = q.range((page - 1) * size, page * size - 1)

    result = await q.execute()
    total = result.count or 0

    items = []
    for row in result.data:
        items.append(
            TransactionRead(
                id=row["id"],
                account_id=row["account_id"],
                asset_id=row.get("asset_id"),
                type=row["type"],
                trade_date=date.fromisoformat(row["trade_date"]),
                quantity=Decimal(str(row["quantity"])),
                price=Decimal(str(row["price"])),
                fees=Decimal(str(row["fees"])),
                notes=row.get("notes"),
                created_at=row["created_at"],
                symbol=row["assets"]["symbol"] if row.get("assets") else None,
                account_name=row["accounts"]["name"] if row.get("accounts") else None,
            )
        )
    return TransactionPage(items=items, total=total, page=page, size=size)


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    body: TransactionCreate,
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> TransactionRead:
    account_ids = await _user_account_ids(user, db)
    if str(body.account_id) not in account_ids:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    if body.type == "SELL" and body.asset_id:
        existing = (
            await db.table("transactions")
            .select("type,trade_date,quantity,price,fees")
            .eq("account_id", str(body.account_id))
            .eq("asset_id", str(body.asset_id))
            .execute()
        )
        txs = [_row_to_tx(r) for r in existing.data]
        error = validate_sell(txs, body.quantity, body.trade_date)
        if error:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    payload = {
        "account_id": str(body.account_id),
        "asset_id": str(body.asset_id) if body.asset_id else None,
        "type": body.type,
        "trade_date": body.trade_date.isoformat(),
        "quantity": str(body.quantity),
        "price": str(body.price),
        "fees": str(body.fees),
        "notes": body.notes,
    }
    result = await db.table("transactions").insert(payload).execute()
    row = result.data[0]

    symbol = None
    if row.get("asset_id"):
        a = await db.table("assets").select("symbol").eq("id", row["asset_id"]).maybe_single().execute()
        symbol = a.data["symbol"] if a.data else None

    acct = await db.table("accounts").select("name").eq("id", row["account_id"]).maybe_single().execute()

    return TransactionRead(
        id=row["id"],
        account_id=row["account_id"],
        asset_id=row.get("asset_id"),
        type=row["type"],
        trade_date=date.fromisoformat(row["trade_date"]),
        quantity=Decimal(str(row["quantity"])),
        price=Decimal(str(row["price"])),
        fees=Decimal(str(row["fees"])),
        notes=row.get("notes"),
        created_at=row["created_at"],
        symbol=symbol,
        account_name=acct.data["name"] if acct.data else None,
    )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> None:
    account_ids = await _user_account_ids(user, db)
    check = (
        await db.table("transactions")
        .select("id")
        .eq("id", str(transaction_id))
        .in_("account_id", account_ids)
        .maybe_single()
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    await db.table("transactions").delete().eq("id", str(transaction_id)).execute()
