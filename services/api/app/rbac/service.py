"""
RBAC Permission Service

DB-backed permission resolution with caching.
Matches the TypeScript implementation's behavior.
"""

from app.auth.deps import AuthContext
from app.db.models import AuthPermission, AuthRole, AuthRolePermission, User
from app.errors import NotFoundError, RBACError
from cachetools import TTLCache  # type: ignore
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

# Permission cache: user_id -> set of permissions
# TTL of 60 seconds matches TypeScript implementation
_permission_cache: TTLCache[str, set[str]] = TTLCache(maxsize=1000, ttl=60)


async def resolve_permissions(
    db: AsyncSession,
    role_ids: list[str] | None = None,
    grant_ids: list[str] | None = None,
    deny_ids: list[str] | None = None,
) -> set[str]:
    """
    Resolve permissions from a collection of IDs.
    Used for previewing permissions before a user is created.
    """
    permissions: set[str] = set()

    if role_ids:
        # Get permissions assigned to these roles
        perm_result = await db.execute(
            select(AuthPermission.full_permission)
            .join(
                AuthRolePermission,
                AuthRolePermission.permission_id == AuthPermission.id,
            )
            .where(AuthRolePermission.role_id.in_(role_ids))
        )
        for row in perm_result.scalars():
            permissions.add(row)

        # Check if any of these roles are "ADMIN" role (by name)
        admin_check = await db.execute(
            select(AuthRole.name).where(AuthRole.id.in_(role_ids))
        )
        for role_name in admin_check.scalars():
            if role_name == "ADMIN":
                # Add base admin permissions
                permissions.update(
                    {
                        "user:read",
                        "user:create",
                        "user:update",
                        "user:delete",
                        "course:read",
                        "course:create",
                        "course:update",
                        "course:update_any",
                        "course:delete",
                        "course:delete_any",
                        "group:read",
                        "group:create",
                        "group:update",
                        "group:delete",
                        "groups:read",
                        "groups:create",
                        "groups:update",
                        "groups:delete",
                        "learning_path:read",
                        "learning_path:create",
                        "learning_path:update",
                        "learning_path:delete",
                        "assignment:read",
                        "assignment:create",
                        "assignment:update",
                        "assignment:delete",
                        "branches:read",
                        "branches:create",
                        "branches:update",
                        "branches:delete",
                        "automations:read",
                        "automations:create",
                        "automations:update",
                        "automations:delete",
                        "notifications:read",
                        "notifications:create",
                        "notifications:update",
                        "notifications:delete",
                        "reports:read",
                        "reports:create",
                        "reports:update",
                        "reports:delete",
                        "skills:read",
                        "skills:create",
                        "skills:update",
                        "skills:delete",
                        "security:sessions:read",
                        "security:audit:read",
                    }
                )
                break

    if grant_ids:
        # Get full permission strings for these grant IDs
        grant_result = await db.execute(
            select(AuthPermission.full_permission).where(
                AuthPermission.id.in_(grant_ids)
            )
        )
        for perm in grant_result.scalars():
            permissions.add(perm)

    if deny_ids:
        # Get full permission strings for these deny IDs
        deny_result = await db.execute(
            select(AuthPermission.full_permission).where(
                AuthPermission.id.in_(deny_ids)
            )
        )
        for perm in deny_result.scalars():
            permissions.discard(perm)

    return permissions


async def get_user_permissions(
    db: AsyncSession,
    user_id: str,
    node_id: str | None = None,
) -> set[str]:
    """
    Get all permissions for a user by aggregating from roles + overrides.

    Resolution order:
    1. Get user's role keys from users.activeRole + user_roles table
    2. Map role keys to auth_role entries
    3. Get permissions via auth_role_permission -> auth_permission
    4. Apply rbacOverrides (grants then denies)

    Args:
        db: Database session
        user_id: User's UUID
        node_id: Optional node ID (currently unused in caching key)

    Returns:
        Set of permission strings (e.g., "course:create")
    """
    # Check cache first
    cache_key = user_id
    if cache_key in _permission_cache:
        return _permission_cache[cache_key]

    # Fetch user with roles
    print(f"DEBUG_RBAC: get_user_permissions for user_id={user_id}")

    try:
        # We bypass tenant filtering here to ensure we can always find the user metadata
        # for authorization, even if the current tenant context is wrong (e.g. during switching)
        from app.db.hooks import bypass_tenant_filter
        token = bypass_tenant_filter.set(True)
        try:
            result = await db.execute(
                select(User).options(selectinload(User.roles)).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()
        finally:
            bypass_tenant_filter.reset(token)

        if not user:
            print(f"DEBUG_RBAC: User {user_id} NOT FOUND")
            # Return 404 instead of 403 to avoid information leakage
            raise NotFoundError("User")

        # Collect all role keys
        role_keys: set[str] = set()
        print(f"DEBUG_RBAC: User roles: active={user.active_role}, base={user.role}")

        # Primary role from users.active_role or users.role
        if user.active_role:
            role_keys.add(
                user.active_role.value
                if hasattr(user.active_role, "value")
                else str(user.active_role)
            )
        if user.role:
            role_keys.add(
                user.role.value if hasattr(user.role, "value") else str(user.role)
            )

        # Additional roles from user_roles
        for user_role in user.roles:
            role_key = user_role.role_key
            role_keys.add(
                role_key.value if hasattr(role_key, "value") else str(role_key)
            )

        # Get permissions from DB via role names
        permissions: set[str] = set()

        if role_keys:
            # Query auth_role -> auth_role_permission -> auth_permission
            perm_result = await db.execute(
                select(AuthPermission.full_permission)
                .join(
                    AuthRolePermission,
                    AuthRolePermission.permission_id == AuthPermission.id,
                )
                .join(AuthRole, AuthRole.id == AuthRolePermission.role_id)
                .where(AuthRole.name.in_(role_keys))
            )
            for row in perm_result.scalars():
                permissions.add(row)

        # Ensure base admin permissions even if RBAC tables are incomplete
        if "ADMIN" in role_keys:
            permissions = {
                *permissions,
                # User management
                "user:read",
                "user:create",
                "user:update",
                "user:delete",
                # Course management
                "course:read",
                "course:create",
                "course:update",
                "course:update_any",
                "course:delete",
                "course:delete_any",
                # Group management
                "group:read",
                "group:create",
                "group:update",
                "group:delete",
                "groups:read",
                "groups:create",
                "groups:update",
                "groups:delete",
                # Learning paths
                "learning_path:read",
                "learning_path:create",
                "learning_path:update",
                "learning_path:delete",
                # Assignments
                "assignment:read",
                "assignment:create",
                "assignment:update",
                "assignment:delete",
                "submission:read",
                "submission:create",
                "submission:update",
                "submission:delete",
                "submission:grade",
                # Others
                "branches:read",
                "branches:create",
                "branches:update",
                "branches:delete",
                "automations:read",
                "automations:create",
                "automations:update",
                "automations:delete",
                "notifications:read",
                "notifications:create",
                "notifications:update",
                "notifications:delete",
                "reports:read",
                "reports:create",
                "reports:update",
                "reports:delete",
                "skills:read",
                "skills:create",
                "skills:update",
                "skills:delete",
                "categories:read",
                "categories:create",
                "categories:update",
                "categories:delete",
                "security:sessions:read",
                "security:audit:read",
            }

        # Ensure base instructor permissions
        if "INSTRUCTOR" in role_keys or "SUPER_INSTRUCTOR" in role_keys:
            permissions.update(
                {
                    "course:read",
                    "course:create",
                    "course:update",
                    "course:delete",
                    "learning_path:read",
                    "learning_path:create",
                    "learning_path:update",
                    "assignment:read",
                    "assignment:create",
                    "assignment:update",
                    "submission:read",
                    "submission:grade",
                    "groups:read",
                    "groups:create",
                    "groups:update",
                    "enrollments:read",
                    "enrollments:update",
                    "categories:read",
                    "branches:read",
                    "skills:read",
                    "conference:read",
                    "conference:create",
                    "calendar:read",
                    "calendar:create",
                    "reports:read",
                    "reports:export",
                }
            )

        # Ensure base learner permissions
        if "LEARNER" in role_keys:
            permissions.update(
                {
                    "course:read",
                    "enrollments:read",
                    "enrollments:create",
                    "learning_path:read",
                    "assignment:read",
                    "submission:read",
                    "submission:create",
                    "profile:read",
                    "profile:update",
                    "categories:read",
                    "branches:read",
                }
            )

        # Apply overrides from users.rbac_overrides
        if user.rbac_overrides:
            overrides = user.rbac_overrides

            # Apply grants first
            grants = overrides.get("grants", [])
            if isinstance(grants, list):
                for perm in grants:
                    permissions.add(perm)

            # Apply denies (takes precedence)
            denies = overrides.get("denies", [])
            if isinstance(denies, list):
                for perm in denies:
                    permissions.discard(perm)

        # Update cache
        _permission_cache[cache_key] = permissions

        return permissions
    except Exception as e:
        logger.exception(
            f"[RBAC] Error getting permissions for user {user_id}: {str(e)}"
        )
        raise e


async def can(
    db: AsyncSession,
    context: AuthContext,
    permission: str,
) -> bool:
    """
    Check if user has a specific permission.

    Args:
        db: Database session
        context: Auth context from require_auth
        permission: Permission string to check (e.g., "course:create")

    Returns:
        True if user has permission, False otherwise
    """
    permissions = await get_user_permissions(db, context.user_id, context.node_id)
    return permission in permissions


async def require_permission(
    db: AsyncSession,
    context: AuthContext,
    permission: str,
) -> None:
    """
    Require a specific permission - raises 403 if missing.

    Args:
        db: Database session
        context: Auth context from require_auth
        permission: Permission string required

    Raises:
        RBACError: If permission is missing
    """
    has_permission = await can(db, context, permission)
    if not has_permission:
        raise RBACError(permission)


def clear_permission_cache(user_id: str | None = None) -> None:
    """
    Clear the permission cache.

    Args:
        user_id: If provided, clear only this user's cache. Otherwise clear all.
    """
    if user_id:
        _permission_cache.pop(user_id, None)
    else:
        _permission_cache.clear()


async def get_all_permissions_for_role(db: AsyncSession, role_name: str) -> list[str]:
    """
    Get all permissions assigned to a role.

    Args:
        db: Database session
        role_name: Role name (e.g., "ADMIN", "INSTRUCTOR")

    Returns:
        List of permission strings
    """
    result = await db.execute(
        select(AuthPermission.full_permission)
        .join(AuthRolePermission, AuthRolePermission.permission_id == AuthPermission.id)
        .join(AuthRole, AuthRole.id == AuthRolePermission.role_id)
        .where(AuthRole.name == role_name)
    )
    return list(result.scalars())
