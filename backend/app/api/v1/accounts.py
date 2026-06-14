import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import AClient as AsyncClient

from app.db.supabase_client import get_supabase
from app.dependencies import get_current_user
from app.schemas.account import AccountCreate, AccountRead, AccountUpdate

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountRead])
async def list_accounts(
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> list[AccountRead]:
    result = await db.table("accounts").select("*").eq("user_id", user["id"]).execute()
    return [AccountRead(**row) for row in result.data]


@router.get("/{account_id}", response_model=AccountRead)
async def get_account(
    account_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> AccountRead:
    result = (
        await db.table("accounts")
        .select("*")
        .eq("id", str(account_id))
        .eq("user_id", user["id"])
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return AccountRead(**result.data)


@router.post("", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
async def create_account(
    body: AccountCreate,
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> AccountRead:
    payload = {**body.model_dump(), "user_id": user["id"]}
    result = await db.table("accounts").insert(payload).execute()
    return AccountRead(**result.data[0])


@router.patch("/{account_id}", response_model=AccountRead)
async def update_account(
    account_id: uuid.UUID,
    body: AccountUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> AccountRead:
    check = (
        await db.table("accounts")
        .select("id")
        .eq("id", str(account_id))
        .eq("user_id", user["id"])
        .maybe_single()
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    result = (
        await db.table("accounts")
        .update(body.model_dump(exclude_unset=True))
        .eq("id", str(account_id))
        .execute()
    )
    return AccountRead(**result.data[0])


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: uuid.UUID,
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> None:
    check = (
        await db.table("accounts")
        .select("id")
        .eq("id", str(account_id))
        .eq("user_id", user["id"])
        .maybe_single()
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    await db.table("accounts").delete().eq("id", str(account_id)).execute()
