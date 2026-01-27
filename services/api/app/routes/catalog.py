"""
Catalog Routes

Public/learner-facing course catalog.
"""

from typing import Annotated, Any

from app.db.models import Course
from app.db.session import get_db
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("")
async def get_catalog(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/catalog
    Returns available courses in the catalog.
    """
    result = await db.execute(
        select(Course).order_by(Course.created_at.desc()).limit(100)
    )
    courses = result.scalars().all()

    return {
        "courses": [
            {
                "id": c.id,
                "title": c.title,
                "code": c.code,
                "description": c.description,
                "thumbnail": c.thumbnail_url,
                "duration": "45m",  # Placeholder as not in DB
                "level": "BEGINNER",  # Placeholder as not in DB
            }
            for c in courses
        ]
    }
