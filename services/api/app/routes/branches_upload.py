from typing import Annotated

from app.auth import RequireAuth
from app.db.session import get_db
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("/{branch_id}/upload")
async def upload_branch_file(
    branch_id: str,
    file: UploadFile = File(...),
    context: RequireAuth = None,  # type: ignore
    db: Annotated[AsyncSession, Depends(get_db)] = None,  # type: ignore
) -> dict:
    return {
        "success": True,
        "file": {"url": f"/files/{file.filename}", "name": file.filename},
    }
