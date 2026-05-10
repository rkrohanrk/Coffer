import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class AccountCreate(BaseModel):
    name: str
    type: Literal["BROKERAGE", "RETIREMENT"]
    institution: str | None = None


class AccountUpdate(BaseModel):
    name: str | None = None
    type: Literal["BROKERAGE", "RETIREMENT"] | None = None
    institution: str | None = None


class AccountRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    type: str
    institution: str | None
    created_at: datetime
