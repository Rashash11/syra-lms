"""
User Routes

CRUD endpoints for user management with RBAC and node scoping.
"""

from datetime import datetime
from typing import Annotated, Any

from app.auth import RequireAuth, hash_password
from app.db.models import AuthPermission, AuthRole, RoleKey, User, UserRole, UserStatus
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError
from app.rbac import can
from app.scope import enforce_node_filter
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import and_, exists, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter()


# ============= Request/Response Schemas =============


class CreateUserRequest(BaseModel):
    username: str | None = None
    email: EmailStr
    firstName: str = Field(min_length=1)
    lastName: str = Field(min_length=1)
    password: str | None = None
    role: str | None = None
    nodeId: str | None = None
    status: str | None = None

    # Advanced fields
    roleIds: list[str] = []
    grantIds: list[str] = []
    denyIds: list[str] = []
    bio: str | None = None
    timezone: str | None = None
    language: str | None = None
    excludeFromEmails: bool = False
    deactivateAt: datetime | None = None
    activeRole: str | None = None


class UpdateUserRequest(BaseModel):
    firstName: str | None = None
    lastName: str | None = None
    bio: str | None = None
    timezone: str | None = None
    language: str | None = None
    status: str | None = None
    role: str | None = None
    activeRole: str | None = None


class BulkActionRequest(BaseModel):
    ids: list[str]
    action: str | None = None
    status: str | None = None


class UserListResponse(BaseModel):
    users: list[dict[str, Any]]
    total: int
    page: int
    limit: int
    totalPages: int


# ============= Endpoints =============


@router.get("")
async def list_users(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str = Query("", description="Search by name, email, or username"),
    status: str = Query("", description="Filter by status"),
    role: str = Query("", description="Filter by role"),
    allNodes: bool = Query(False, description="Admin: view across all branches"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at", description="Sort field"),
    order: str = Query("desc", description="Sort order (asc/desc)"),
) -> UserListResponse:
    """
    List users with pagination and filtering.
    Respects node scoping for non-admin users.
    """
    # Check permission
    if not await can(db, context, "user:read"):
        raise RBACError("user:read")

    # Build query
    query = select(User).options(selectinload(User.roles))
    count_query = select(func.count()).select_from(User)

    # Apply search filter
    if search:
        search_filter = (
            User.first_name.ilike(f"%{search}%")
            | User.last_name.ilike(f"%{search}%")
            | User.email.ilike(f"%{search}%")
            | User.username.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Apply status filter
    if status and status != "all":
        query = query.where(User.status == status.upper())
        count_query = count_query.where(User.status == status.upper())

    # Apply role filter
    if role and role != "all":
        role_upper = role.upper()
        role_exists = exists(
            select(UserRole.id).where(
                and_(UserRole.user_id == User.id, UserRole.role_key == role_upper)
            )
        )
        role_filter = or_(
            User.active_role == role_upper,
            User.role == role_upper,
            role_exists,
        )
        query = query.where(role_filter)
        count_query = count_query.where(role_filter)

    # Apply node scope filtering (Admins can view all branches with allNodes=1)
    if not (context.role == "ADMIN" and allNodes):
        query = enforce_node_filter(query, User, "node_id", context)
        count_query = enforce_node_filter(count_query, User, "node_id", context)

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Apply sorting
    sort_column: Any = User.created_at
    if sort_by == "firstName":
        sort_column = User.first_name
    elif sort_by == "lastName":
        sort_column = User.last_name
    elif sort_by == "email":
        sort_column = User.email
    elif sort_by == "username":
        sort_column = User.username
    elif sort_by == "lastLoginAt":
        sort_column = User.last_login_at

    if order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # Apply pagination
    skip = (page - 1) * limit
    query = query.offset(skip).limit(limit)

    # Execute query
    result = await db.execute(query)
    users = result.scalars().all()

    # Transform for response
    users_data = []
    for user in users:
        role_keys = [ur.role_key.value for ur in user.roles] if user.roles else []
        if not role_keys:
            role_keys = [
                user.role.value if hasattr(user.role, "value") else str(user.role)
            ]

        users_data.append(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "status": (
                    user.status.value
                    if hasattr(user.status, "value")
                    else str(user.status)
                ),
                "role": (
                    user.role.value if hasattr(user.role, "value") else str(user.role)
                ),
                "activeRole": (
                    user.active_role.value
                    if hasattr(user.active_role, "value")
                    else str(user.active_role)
                ),
                "roles": role_keys,
                "isActive": user.is_active,
                "nodeId": user.node_id,
                "createdAt": user.created_at.isoformat() if user.created_at else None,
            }
        )

    return UserListResponse(
        users=users_data,
        total=total,
        page=page,
        limit=limit,
        totalPages=(total + limit - 1) // limit,
    )


@router.post("")
async def create_user(
    request: CreateUserRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Create a new user.
    """
    # Check permission
    if not await can(db, context, "user:create"):
        raise RBACError("user:create")

    # Check if email or username exists (Active users)
    # The ORM hook filters out soft-deleted users, so this only finds active ones.
    result = await db.execute(
        select(User).where(
            (User.email == request.email.lower())
            | (User.username == (request.username or ""))
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise BadRequestError("User with this email or username already exists")

    # Check for Soft-Deleted users (Raw SQL to bypass hooks)
    # If found, we can either reactivate them or error.
    # For now, let's error but with a clear message, or better: reactivate.
    # Reactivating is complex because we need to reset password, etc.
    # Let's just check if they exist to prevent IntegrityError.
    from sqlalchemy import text

    raw_query = text("""
        SELECT id, "deletedAt" FROM users
        WHERE (email = :email OR username = :username)
        AND "deletedAt" IS NOT NULL
        LIMIT 1
    """)
    raw_result = await db.execute(
        raw_query, {"email": request.email.lower(), "username": request.username or ""}
    )
    deleted_user_row = raw_result.fetchone()

    if deleted_user_row:
        # User exists but is deleted.
        # Option A: Reactivate automatically?
        # Option B: Raise error saying "User exists in archive".
        # Let's try to restore them if they are deleted.

        # To restore, we need to fetch the object including deleted.
        # But our session is hooked.
        # We can update it via raw SQL to clear deletedAt first.
        user_id = deleted_user_row.id
        await db.execute(
            text(
                'UPDATE users SET "deletedAt" = NULL, status = :status WHERE id = :id'
            ),
            {"status": "ACTIVE", "id": user_id},
        )
        # Now we can fetch it via ORM
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()

        # Update fields with new values
        if request.password:
            user.password_hash = hash_password(request.password)
        user.first_name = request.firstName
        user.last_name = request.lastName
        user.active_role = RoleKey(request.role or "LEARNER")
        user.role = RoleKey(request.role or "LEARNER")

        await db.commit()
        await db.refresh(user)

        return {
            "ok": True,
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role),
            "tenantId": user.tenant_id,
            "nodeId": user.node_id,
            "restored": True,
        }

    # Hash password or generate temporary
    if request.password:
        password_hash = hash_password(request.password)
    else:
        import secrets

        temp_password = f"Temp{secrets.token_urlsafe(8)}!1"
        password_hash = hash_password(temp_password)

    # Security check: only ADMIN can create ADMIN users
    if request.role == "ADMIN" and context.role != "ADMIN":
        raise RBACError("Only administrators can create admin users")

    # Create user
    user_role = request.activeRole or request.role or "LEARNER"
    gen_username = request.username or (request.email.split("@")[0].replace(".", "_"))

    # Inherit node_id from creator context if not provided in request
    # This ensures scoped admins create users within their scope
    target_node_id = request.nodeId or context.node_id

    # Prepare RBAC overrides
    rbac_overrides: dict[str, Any] | None = None
    if request.grantIds or request.denyIds:
        rbac_overrides = {"grants": [], "denies": []}

        if request.grantIds:
            grant_perms = await db.execute(
                select(AuthPermission.full_permission).where(
                    AuthPermission.id.in_(request.grantIds)
                )
            )
            rbac_overrides["grants"] = list(grant_perms.scalars().all())

        if request.denyIds:
            deny_perms = await db.execute(
                select(AuthPermission.full_permission).where(
                    AuthPermission.id.in_(request.denyIds)
                )
            )
            rbac_overrides["denies"] = list(deny_perms.scalars().all())

    user = User(
        username=gen_username,
        email=request.email.lower(),
        first_name=request.firstName,
        last_name=request.lastName,
        password_hash=password_hash,
        role=user_role,
        active_role=user_role,
        tenant_id=context.tenant_id,
        node_id=target_node_id,
        status=request.status or "ACTIVE",
        is_active=True,
        bio=request.bio,
        timezone=request.timezone or "UTC",
        language=request.language or "en",
        exclude_from_emails=request.excludeFromEmails,
        deactivate_at=request.deactivateAt,
        rbac_overrides=rbac_overrides,
    )

    db.add(user)
    await db.flush()  # Get ID

    # Assign Roles
    if request.roleIds:
        # Fetch roles to get names
        roles_res = await db.execute(
            select(AuthRole).where(AuthRole.id.in_(request.roleIds))
        )
        roles = roles_res.scalars().all()

        for role in roles:
            # Check if role name maps to RoleKey
            try:
                # We try to map the role name to RoleKey enum
                # If AuthRole.name is "Administrator", RoleKey("Administrator")
                # -> RoleKey.ADMIN ??
                # RoleKey values are uppercase usually: "ADMIN", "INSTRUCTOR"
                # If AuthRole names match RoleKey values (e.g. "ADMIN"), it works.
                # If AuthRole names are "Administrator", we might need mapping.
                # Assuming AuthRole.name matches RoleKey value for now.
                role_key = RoleKey(role.name)

                # Create UserRole
                db.add(
                    UserRole(
                        tenant_id=context.tenant_id, user_id=user.id, role_key=role_key
                    )
                )
            except ValueError:
                # Role name not in RoleKey enum - skip for now or log warning
                # Ideally we should support custom roles but UserRole table is
                # restricted
                pass

    await db.commit()
    await db.refresh(user)

    return {
        "ok": True,
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        "tenantId": user.tenant_id,
        "nodeId": user.node_id,
    }


@router.get("/search")
async def search_users(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(""),
    excludeCourseId: str | None = None,
    limit: int = 20,
) -> dict[str, Any]:
    """
    Search users for autocomplete.
    """
    if not await can(db, context, "user:read"):
        raise RBACError("user:read")

    query = select(User)

    if q:
        query = query.where(
            (User.first_name.ilike(f"%{q}%"))
            | (User.last_name.ilike(f"%{q}%"))
            | (User.email.ilike(f"%{q}%"))
            | (User.username.ilike(f"%{q}%"))
        )

    # Exclude users already in course (if needed)
    # This requires joining with Enrollment or checking a subquery
    if excludeCourseId:
        from app.db.models import Enrollment

        subquery = select(Enrollment.user_id).where(
            Enrollment.course_id == excludeCourseId
        )
        query = query.where(User.id.not_in(subquery))

    # Apply node scoping
    query = enforce_node_filter(query, User, "node_id", context)

    query = query.limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "users": [
            {
                "id": u.id,
                "name": f"{u.first_name} {u.last_name}".strip() or u.username,
                "email": u.email,
                "avatar": u.avatar,
            }
            for u in users
        ]
    }


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Get a single user by ID.
    """
    import logging

    logger = logging.getLogger(__name__)
    logger.info(
        f"[GET /api/users/{user_id}] Request from user_id={context.user_id}, "
        f"tenant_id={context.tenant_id}, role={context.role}"
    )

    try:
        has_perm = await can(db, context, "user:read")
        logger.info(f"[GET /api/users/{user_id}] RBAC check 'user:read' = {has_perm}")
        if not has_perm:
            logger.warning(f"[GET /api/users/{user_id}] RBAC FAILED - returning 403")
            raise RBACError("user:read")
    except Exception as e:
        logger.error(
            f"[GET /api/users/{user_id}] Exception during RBAC check: "
            f"{type(e).__name__}: {str(e)}"
        )
        raise

    logger.info(f"[GET /api/users/{user_id}] Querying database for user...")
    result = await db.execute(
        select(User)
        .options(selectinload(User.roles))
        .where((User.id == user_id) & (User.tenant_id == context.tenant_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        logger.info(f"[GET /api/users/{user_id}] User NOT FOUND - returning 404")
        raise NotFoundError("User")

    logger.info(
        f"[GET /api/users/{user_id}] User found: {user.email}, "
        f"tenant={getattr(user, 'tenant_id', 'N/A')}"
    )

    # Node scope check
    from app.scope import validate_node_access

    if not validate_node_access(context, user.node_id):
        raise NotFoundError("User")

    role_keys = [ur.role_key.value for ur in user.roles] if user.roles else []

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "bio": user.bio,
        "timezone": user.timezone,
        "language": user.language,
        "status": (
            user.status.value if hasattr(user.status, "value") else str(user.status)
        ),
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        "roles": role_keys,
        "isActive": user.is_active,
        "isVerified": user.is_verified,
        "nodeId": user.node_id,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None,
    }


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Update a user.
    """
    if not await can(db, context, "user:update"):
        raise RBACError("user:update")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundError("User")

    # Node scope check
    from app.scope import validate_node_access

    if not validate_node_access(context, user.node_id):
        raise NotFoundError("User")

    # Update fields
    if request.firstName is not None:
        user.first_name = request.firstName
    if request.lastName is not None:
        user.last_name = request.lastName
    if request.bio is not None:
        user.bio = request.bio
    if request.timezone is not None:
        user.timezone = request.timezone
    if request.language is not None:
        user.language = request.language
    if request.status is not None:
        user.status = UserStatus(request.status)

    await db.commit()
    await db.refresh(user)

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "status": (
            user.status.value if hasattr(user.status, "value") else str(user.status)
        ),
    }


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Delete a single user.
    """
    if not await can(db, context, "user:delete"):
        raise RBACError("user:delete")

    # Fetch user first (needed for ORM soft-delete hook)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundError("User")

    # Use ORM delete to trigger soft-delete hook
    await db.delete(user)
    await db.commit()

    return {"success": True, "deleted": True}


@router.delete("")
async def bulk_delete_users(
    request: BulkActionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Bulk delete users.
    """
    if not await can(db, context, "user:delete"):
        raise RBACError("user:delete")

    if not request.ids:
        raise BadRequestError("No user IDs provided")

    # Fetch users to delete
    result = await db.execute(select(User).where(User.id.in_(request.ids)))
    users = result.scalars().all()

    for user in users:
        await db.delete(user)

    await db.commit()

    return {"success": True, "deleted": len(users)}


@router.patch("")
async def bulk_update_users(
    request: BulkActionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Bulk update users (activate, deactivate, unlock).
    """
    if not await can(db, context, "user:update"):
        raise RBACError("user:update")

    if not request.ids:
        raise BadRequestError("No user IDs provided")

    update_data = {}

    if request.action == "activate":
        update_data = {"status": "ACTIVE"}
    elif request.action == "deactivate":
        update_data = {"status": "INACTIVE"}
    elif request.action == "unlock":
        update_data = {
            "status": "ACTIVE",
            "locked_until": None,  # type: ignore
            "failed_login_attempts": 0,  # type: ignore
        }
    elif request.status:
        update_data = {"status": request.status}
    else:
        raise BadRequestError("Invalid action")

    result = await db.execute(
        update(User).where(User.id.in_(request.ids)).values(**update_data)
    )

    await db.commit()

    return {"success": True, "updated": result.rowcount}  # type: ignore
