"""
Calendar Events Route Stub

Placeholder for calendar events functionality.
Frontend expects /api/calendar-events.
"""

from typing import Any

from app.auth import RequireAuth
from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def get_calendar_events(
    context: RequireAuth,
) -> dict[str, Any]:
    """
    GET /api/calendar-events
    Returns calendar events (placeholder).
    """
    # TODO: Implement actual calendar events logic
    return {"events": []}
