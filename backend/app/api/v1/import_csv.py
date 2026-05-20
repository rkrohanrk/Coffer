from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from supabase import AsyncClient

from app.db.supabase_client import get_supabase
from app.dependencies import get_current_user
from app.services.import_service import ImportError, commit_preview, stage_preview

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/csv")
async def upload_csv(
    file: UploadFile,
    user: dict = Depends(get_current_user),
) -> dict:
    content = await file.read()
    try:
        preview_id, rows = await stage_preview(content)
    except ImportError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    return {"preview_id": preview_id, "rows": rows, "count": len(rows)}


@router.post("/csv/{preview_id}/commit")
async def commit_csv(
    preview_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase),
) -> dict:
    try:
        count = await commit_preview(preview_id, db)
    except ImportError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    return {"inserted": count}
