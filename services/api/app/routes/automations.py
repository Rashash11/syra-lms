from typing import Annotated, Any

from app.auth import RequireAuth
from app.db.models import Automation
from app.db.session import get_db
from app.errors import NotFoundError
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


# ============= Schemas =============


class CreateAutomationRequest(BaseModel):
    name: str
    type: str
    parameters: dict = {}
    enabled: bool = True


class UpdateAutomationRequest(BaseModel):
    name: str | None = None
    type: str | None = None
    parameters: dict | None = None
    enabled: bool | None = None
    ids: list[str] | None = None  # Frontend sends this for bulk/single update


# ============= Endpoints =============


@router.get("")
async def list_automations(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=200),
) -> dict[str, Any]:
    """
    GET /api/automations
    List automations.
    """
    skip = (page - 1) * limit
    print(f"DEBUG: Listing automations for tenant {context.tenant_id}")

    # Count query
    count_query = select(func.count()).select_from(Automation).where(
        Automation.tenant_id == context.tenant_id
    )
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    # Data query
    try:
        query = (
            select(Automation)
            .where(Automation.tenant_id == context.tenant_id)
            .order_by(Automation.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e
    items = result.scalars().all()

    data = []
    for item in items:
        data.append({
            "id": item.id,
            "name": item.name,
            "type": item.trigger,  # Map DB trigger -> API type
            "parameters": item.conditions, # Map DB conditions -> API parameters
            "enabled": item.active,      # Map DB active -> API enabled
            "runCount": 0, # Placeholder
            "createdAt": item.created_at.isoformat() if item.created_at else None,
            "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
        })

    return {
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        },
    }


@router.post("")
async def create_automation(
    request: CreateAutomationRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    POST /api/automations
    Create a new automation.
    """
    automation = Automation(
        tenant_id=context.tenant_id,
        name=request.name,
        trigger=request.type,        # Map API type -> DB trigger
        conditions=request.parameters, # Map API parameters -> DB conditions
        actions=[],
        active=request.enabled,      # Map API enabled -> DB active
    )
    db.add(automation)
    await db.commit()
    await db.refresh(automation)

    return {
        "id": automation.id,
        "name": automation.name,
        "type": automation.trigger,
        "enabled": automation.active,
    }


@router.patch("")
async def update_automations_bulk(
    request: UpdateAutomationRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    PATCH /api/automations
    Update automations (bulk or single).
    """
    if not request.ids:
        return {"success": False, "message": "No IDs provided"}

    # Fetch automations to ensure ownership
    result = await db.execute(
        select(Automation).where(
            (Automation.id.in_(request.ids)) & (Automation.tenant_id == context.tenant_id)
        )
    )
    automations = result.scalars().all()

    for automation in automations:
        if request.name is not None:
            automation.name = request.name
        if request.type is not None:
            automation.trigger = request.type
        if request.parameters is not None:
            automation.conditions = request.parameters
        if request.enabled is not None:
            automation.active = request.enabled

    await db.commit()

    return {"success": True, "updated": len(automations)}


@router.delete("")
async def delete_automations_bulk(
    request: UpdateAutomationRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    DELETE /api/automations
    Delete automations.
    """
    if not request.ids:
        return {"success": False, "message": "No IDs provided"}

    # Execute delete
    result = await db.execute(
        delete(Automation).where(
            (Automation.id.in_(request.ids)) & (Automation.tenant_id == context.tenant_id)
        )
    )
    
    await db.commit()

    return {"success": True, "deleted": result.rowcount}
