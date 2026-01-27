from typing import Annotated

from app.auth import RequireAuth
from app.db.session import get_db
from app.rbac import require_permission
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("/learning-paths/{path_id}/options")
async def get_lp_options(
    path_id: str, context: RequireAuth, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict:
    await require_permission(db, context, "learning_path:read")
    return {"options": {"allowSelfEnroll": True, "visibility": "private"}}


@router.put("/learning-paths/{path_id}/options")
async def update_lp_options(
    path_id: str, context: RequireAuth, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict:
    await require_permission(db, context, "learning_path:update")
    return {"success": True}
