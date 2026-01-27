"""
Admin Routes

Implements administrative endpoints matching Next.js /api/admin/* contract:
- roles, permissions
- settings (get/update)
- security (audit, sessions)
- users (import, export, preview-permissions, impersonate)
- notifications admin helpers (partial)
"""

from typing import Annotated, Any, Optional

from app.auth import RequireAuth
from app.db.models import (
    AuthPermission,
    AuthRole,
    Notification,
    NotificationHistory,
    Tenant,
    User,
)
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


# ============= Schemas =============


class SettingsResponse(BaseModel):
    ok: bool = True
    settings: dict[str, Any]


class SettingsUpdateRequest(BaseModel):
    organizationName: Optional[str] = None
    branding: Optional[dict[str, Any]] = None
    notifications: Optional[dict[str, Any]] = None
    security: Optional[dict[str, Any]] = None
    features: Optional[dict[str, Any]] = None
    localization: Optional[dict[str, Any]] = None


class UsersImportRequest(BaseModel):
    fileId: str
    options: Optional[dict[str, Any]] = None


class UsersExportQuery(BaseModel):
    search: Optional[str] = None
    status: Optional[str] = None


class PreviewPermissionsQuery(BaseModel):
    userId: str


# ============= Roles & Permissions =============


@router.get("/roles")
async def get_roles(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("roles:read")
    result = await db.execute(
        select(AuthRole.id, AuthRole.name, AuthRole.description).order_by(
            AuthRole.name.asc()
        )
    )
    rows = result.all()
    roles = [{"id": r[0], "name": r[1], "description": r[2] or ""} for r in rows]
    return {"data": roles}


@router.get("/permissions")
async def get_permissions(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("permissions:read")
    result = await db.execute(
        select(
            AuthPermission.id, AuthPermission.name, AuthPermission.full_permission
        ).order_by(AuthPermission.full_permission.asc())
    )
    rows = result.all()
    perms = [{"id": r[0], "name": r[1], "fullPermission": r[2]} for r in rows]
    return {"data": perms}


# ============= Settings =============


@router.get("/settings")
async def get_settings_admin(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SettingsResponse:
    if context.role != "ADMIN":
        raise RBACError("organization:read")
    if not context.tenant_id:
        raise BadRequestError("Tenant context required")
    result = await db.execute(select(Tenant).where(Tenant.id == context.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundError("Tenant")
    settings: dict[str, Any] = {
        "organizationName": tenant.name,
        "branding": tenant.settings.get("branding") or {},
        "notifications": tenant.settings.get("notifications") or {},
        "security": tenant.settings.get("security") or {},
        "features": tenant.settings.get("features") or {},
        "localization": tenant.settings.get("localization") or {},
    }
    return SettingsResponse(settings=settings)


@router.post("/settings")
async def update_settings_admin(
    request: SettingsUpdateRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SettingsResponse:
    if context.role != "ADMIN":
        raise RBACError("settings:update")
    if not context.tenant_id:
        raise BadRequestError("Tenant context required")
    result = await db.execute(select(Tenant).where(Tenant.id == context.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundError("Tenant")

    # Initialize settings if needed
    current_settings = tenant.settings or {}

    if request.organizationName is not None:
        tenant.name = request.organizationName
    if request.branding is not None:
        current_settings["branding"] = request.branding
    if request.notifications is not None:
        current_settings["notifications"] = request.notifications
    if request.security is not None:
        current_settings["security"] = request.security
    if request.features is not None:
        current_settings["features"] = request.features
    if request.localization is not None:
        current_settings["localization"] = request.localization

    tenant.settings = current_settings

    await db.commit()
    await db.refresh(tenant)

    updated_settings: dict[str, Any] = {
        "organizationName": tenant.name,
        "branding": tenant.settings.get("branding") or {},
        "notifications": tenant.settings.get("notifications") or {},
        "security": tenant.settings.get("security") or {},
        "features": tenant.settings.get("features") or {},
        "localization": tenant.settings.get("localization") or {},
    }
    return SettingsResponse(settings=updated_settings)


# ============= Security: Audit & Sessions =============


@router.get("/security/audit")
async def get_audit_log(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("security:audit:read")
    # Placeholder: audit events table may differ; return empty list with pagination
    return {
        "data": [],
        "pagination": {"page": page, "limit": limit, "total": 0, "totalPages": 0},
    }


@router.get("/security/sessions")
async def list_sessions(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("security:sessions:read")
    return {
        "data": [],
        "pagination": {"page": page, "limit": limit, "total": 0, "totalPages": 0},
    }


@router.delete("/security/sessions")
async def revoke_sessions(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    userId: str = Query(...),
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("security:sessions:revoke")
    return {"success": True}


# ============= Admin Users Utilities =============


@router.get("/users/export")
async def export_users(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("user:read")
    # Simplified export: return IDs matching filters (frontend can request file later)
    query = select(User.id)
    if search:
        query = query.where(
            (User.first_name.ilike(f"%{search}%"))
            | (User.last_name.ilike(f"%{search}%"))
            | (User.email.ilike(f"%{search}%"))
            | (User.username.ilike(f"%{search}%"))
        )
    if status and status != "all":
        query = query.where(User.status == status.upper())
    result = await db.execute(query)
    ids = list(result.scalars())
    return {"data": ids}


@router.get("/users/preview-permissions")
async def preview_permissions(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    userId: str | None = Query(None),
    roleIds: str | None = Query(None),
    grantIds: str | None = Query(None),
    denyIds: str | None = Query(None),
) -> dict[str, Any]:
    """
    Preview permissions for a user (existing or new).
    """
    if context.role != "ADMIN":
        raise RBACError("user:read")

    from app.rbac import get_user_permissions, resolve_permissions

    if userId:
        # For existing user
        perms = await get_user_permissions(db, userId, None)
    else:
        # Dynamic preview for new user
        role_list = roleIds.split(",") if roleIds else []
        grant_list = grantIds.split(",") if grantIds else []
        deny_list = denyIds.split(",") if denyIds else []
        perms = await resolve_permissions(db, role_list, grant_list, deny_list)

    return {"permissions": list(perms)}


@router.get("/user-types")
async def get_user_types(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    List all user types (legacy roles).
    """
    if context.role != "ADMIN":
        raise RBACError("user_types:read")
    from app.db.models import UserType

    result = await db.execute(select(UserType).order_by(UserType.name.asc()))
    types = result.scalars().all()
    return {
        "success": True,
        "data": [
            {"id": t.id, "name": t.name, "permissions": t.permissions} for t in types
        ],
    }


@router.post("/users/import")
async def import_users(
    request: UsersImportRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("user:create")
    # Enqueue Celery task (implemented in app.jobs.tasks)
    from app.jobs.tasks import users_import

    task = users_import.delay(
        tenant_id=context.tenant_id or "",
        file_id=request.fileId,
        options=request.options or {},
        requester_id=context.user_id,
    )
    return {"success": True, "taskId": task.id}


@router.post("/users/{user_id}/impersonate")
async def impersonate_user(
    user_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("user:impersonate")
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise NotFoundError("User")
    if getattr(target.role, "value", str(target.role)) == "ADMIN":
        raise BadRequestError("Cannot impersonate an Administrator")
    # Issue a token with target user's identity, same tenant/node
    from app.auth import create_access_token

    token = create_access_token(
        user_id=target.id,
        email=target.email,
        role=getattr(target.role, "value", str(target.role)),
        tenant_id=target.tenant_id,
        node_id=target.node_id,
        token_version=target.token_version or 0,
    )
    # Return token; frontend can store/submit as cookie via fetch
    return {"ok": True, "token": token, "userId": target.id}


__all__ = ["router"]

# ============= Admin Notifications =============


@router.get("/notifications")
async def admin_list_notifications(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("notifications:read")
    skip = (page - 1) * limit
    count_result = await db.execute(select(func.count()).select_from(Notification))
    total = count_result.scalar() or 0
    result = await db.execute(
        select(Notification)
        .offset(skip)
        .limit(limit)
        .order_by(Notification.updated_at.desc())
    )
    notifications = result.scalars().all()
    data = [
        {
            "id": n.id,
            "name": n.name,
            "eventKey": n.event_key,
            "messageSubject": n.message_subject,
            "messageBody": n.message_body,
            "recipientType": n.recipient_type,
            "isActive": n.is_active,
            "createdAt": n.created_at.isoformat() if n.created_at else None,
            "updatedAt": n.updated_at.isoformat() if n.updated_at else None,
        }
        for n in notifications
    ]
    return {
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        },
    }


class CreateAdminNotificationRequest(BaseModel):
    name: str
    eventKey: str
    messageSubject: str
    messageBody: str
    recipientType: str


@router.post("/notifications")
async def admin_create_notification(
    request: CreateAdminNotificationRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("notifications:create")
    notif = Notification(
        tenant_id=context.tenant_id,
        name=request.name,
        event_key=request.eventKey,
        message_subject=request.messageSubject,
        message_body=request.messageBody,
        recipient_type=request.recipientType,
        is_active=True,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return {"id": notif.id, "name": notif.name}


@router.get("/notifications/{notification_id}")
async def admin_get_notification(
    notification_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("notifications:read")
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    n = result.scalar_one_or_none()
    if not n:
        raise NotFoundError("Notification")
    return {
        "id": n.id,
        "name": n.name,
        "eventKey": n.event_key,
        "messageSubject": n.message_subject,
        "messageBody": n.message_body,
        "recipientType": n.recipient_type,
        "isActive": n.is_active,
        "createdAt": n.created_at.isoformat() if n.created_at else None,
        "updatedAt": n.updated_at.isoformat() if n.updated_at else None,
    }


class UpdateAdminNotificationRequest(BaseModel):
    name: Optional[str] = None
    eventKey: Optional[str] = None
    messageSubject: Optional[str] = None
    messageBody: Optional[str] = None
    recipientType: Optional[str] = None
    isActive: Optional[bool] = None


@router.put("/notifications/{notification_id}")
async def admin_update_notification(
    notification_id: str,
    request: UpdateAdminNotificationRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("notifications:update")
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    n = result.scalar_one_or_none()
    if not n:
        raise NotFoundError("Notification")
    if request.name is not None:
        n.name = request.name
    if request.eventKey is not None:
        n.event_key = request.eventKey
    if request.messageSubject is not None:
        n.message_subject = request.messageSubject
    if request.messageBody is not None:
        n.message_body = request.messageBody
    if request.recipientType is not None:
        n.recipient_type = request.recipientType
    if request.isActive is not None:
        n.is_active = request.isActive
    await db.commit()
    await db.refresh(n)
    return {"id": n.id, "isActive": n.is_active}


@router.delete("/notifications/{notification_id}")
async def admin_delete_notification(
    notification_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Any:
    import logging

    logger = logging.getLogger(__name__)
    logger.info(f"[DELETE] Admin deleting notification {notification_id}")

    if context.role != "ADMIN":
        raise RBACError("notifications:delete")

    try:
        result = await db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        n = result.scalar_one_or_none()
        if not n:
            logger.warning(f"[DELETE] Notification {notification_id} not found")
            raise NotFoundError("Notification")

        # Manually delete history first to avoid 500 if cascade fails
        await db.execute(
            delete(NotificationHistory).where(
                NotificationHistory.notification_id == notification_id
            )
        )

        await db.delete(n)
        await db.commit()
        logger.info(f"[DELETE] Notification {notification_id} deleted successfully")
        return {"success": True, "deleted": notification_id}
    except Exception as e:
        logger.exception(
            f"[DELETE] Error deleting notification {notification_id}: {str(e)}"
        )
        # Return error details for debugging (temporary)
        from fastapi.responses import JSONResponse

        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e), "type": type(e).__name__},
        )
        # raise e


@router.patch("/notifications/{notification_id}/toggle")
async def admin_toggle_notification(
    notification_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("notifications:update")
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    n = result.scalar_one_or_none()
    if not n:
        raise NotFoundError("Notification")
    n.is_active = not n.is_active
    await db.commit()
    await db.refresh(n)
    return {"id": n.id, "isActive": n.is_active}


@router.post("/notifications/{notification_id}/duplicate")
async def admin_duplicate_notification(
    notification_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("notifications:create")
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    n = result.scalar_one_or_none()
    if not n:
        raise NotFoundError("Notification")
    dup = Notification(
        tenant_id=context.tenant_id,
        name=f"{n.name} (Copy)",
        event_key=n.event_key,
        message_subject=n.message_subject,
        message_body=n.message_body,
        recipient_type=n.recipient_type,
        is_active=False,
    )
    db.add(dup)
    await db.commit()
    await db.refresh(dup)
    return {"id": dup.id, "name": dup.name}


@router.post("/notifications/{notification_id}/preview")
async def admin_preview_notification(
    notification_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    email: str = Query(...),
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("notifications:read")
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    n = result.scalar_one_or_none()
    if not n:
        raise NotFoundError("Notification")
    # Simulate preview
    return {
        "preview": {"to": email, "subject": n.message_subject, "body": n.message_body}
    }


@router.get("/notifications/events")
async def admin_notification_events(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("notifications:read")
    # Placeholder: return static events list
    return {"events": ["USER_SIGNUP", "COURSE_PUBLISHED", "ASSIGNMENT_CREATED"]}


@router.post("/notifications/pending/{queue_id}/cancel")
async def admin_cancel_pending_notification(
    queue_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if context.role != "ADMIN":
        raise RBACError("notifications:update")
    # Placeholder: cancel in queue system (to be wired to Celery)
    return {"success": True, "cancelled": queue_id}
