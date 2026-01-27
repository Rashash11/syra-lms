from typing import Annotated

from app.auth import RequireAuth
from app.db.session import get_db
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("")
async def list_skills(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return {"data": []}


@router.post("")
async def create_skill(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return {"success": True}
