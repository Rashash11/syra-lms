"""
Auth Routes

All authentication endpoints matching the TypeScript implementation.
"""

from datetime import datetime, timezone
from typing import Annotated, Any

from app.auth import (
    RequireAuth,
    create_access_token,
    hash_password,
    validate_password_policy,
    verify_password,
    verify_token,
)
from app.config import get_settings
from app.db.hooks import TenantContextManager
from app.db.models import Branch, PasswordResetToken, User, RoleKey, Tenant
from app.db.session import get_db
from app.errors import AuthError, BadRequestError, NotFoundError
from app.core.tenant import get_tenant_id
from app.rbac import get_user_permissions
from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

router = APIRouter()
settings = get_settings()


# ============= Request/Response Schemas =============


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    ok: bool = True
    userId: str
    role: str
    activeRole: str


class SignupRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3)
    password: str = Field(min_length=8)
    firstName: str = Field(min_length=1)
    lastName: str = Field(min_length=1)


class MeResponse(BaseModel):
    ok: bool = True
    claims: dict[str, Any]
    user: dict[str, Any]


class SwitchNodeRequest(BaseModel):
    nodeId: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8)
    newPassword: str | None = None


# ============= Helper Functions =============


def set_session_cookie(response: Response, token: str) -> None:
    """Set the session cookie on response."""
    response.set_cookie(
        key="session",
        value=token,
        httponly=settings.cookie_httponly,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
        path="/",
        max_age=settings.access_token_expire_seconds,
    )


def clear_session_cookie(response: Response) -> None:
    """Clear the session cookie."""
    response.delete_cookie(key="session", path="/")


# ============= Endpoints =============


@router.post("/login")
async def login(
    request: LoginRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LoginResponse:
    """
    Login with email and password.
    Sets httpOnly session cookie on success.
    """
    # Find user by email
    try:
        result = await db.execute(
            select(User).where(User.email == request.email.lower())
        )
        user = result.scalar_one_or_none()

        if not user or not user.password_hash:
            raise AuthError("Invalid email or password", status_code=401)

        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise AuthError("Invalid email or password", status_code=401)

        # Check if active
        if not user.is_active:
            raise AuthError("Account is disabled", status_code=403)

        # Update last login
        # Use TenantContextManager(bypass=True) to bypass tenant checks for login updates
        # This prevents errors if the request has a stale/mismatched session cookie
        with TenantContextManager(bypass=True):
            user.last_login_at = datetime.now(timezone.utc).replace(tzinfo=None)
            await db.commit()

        # Get token version
        token_version = user.token_version or 0

        # Create access token
        role_str = (
            user.active_role.value
            if hasattr(user.active_role, "value")
            else str(user.active_role)
        )

        token = create_access_token(
            user_id=user.id,
            email=user.email,
            role=role_str,
            tenant_id=user.tenant_id,
            node_id=user.node_id,
            token_version=token_version,
        )

        # Set cookie
        set_session_cookie(response, token)

        return LoginResponse(
            ok=True,
            userId=user.id,
            role=role_str,
            activeRole=role_str,
        )
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise e


@router.post("/logout")
async def logout(
    response: Response,
    context: RequireAuth,
) -> dict[str, Any]:
    """
    Logout current session.
    Clears the session cookie.
    """
    clear_session_cookie(response)
    return {"ok": True, "message": "Logged out successfully"}


@router.post("/logout-all")
async def logout_all(
    response: Response,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Logout all sessions by incrementing tokenVersion.
    This invalidates all existing tokens.
    """
    # Increment token version
    await db.execute(
        text("""
            UPDATE users
            SET token_version = COALESCE(token_version, 0) + 1
            WHERE id = :user_id
        """),
        {"user_id": context.user_id},
    )
    await db.commit()

    # Clear current session
    clear_session_cookie(response)

    return {"ok": True, "message": "All sessions invalidated"}


@router.get("/me")
async def get_me(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MeResponse:
    """
    Get current user info and claims.
    """
    result = await db.execute(select(User).where(User.id == context.user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundError("User")

    return MeResponse(
        ok=True,
        claims={
            "userId": context.user_id,
            "email": context.email,
            "role": context.role,
            "nodeId": context.node_id,
            "tokenVersion": context.token_version,
        },
        user={
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": (
                user.active_role.value
                if hasattr(user.active_role, "value")
                else str(user.active_role)
            ),
            "isActive": user.is_active,
            "isVerified": user.is_verified,
        },
    )


@router.get("/permissions")
async def get_permissions(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Get current user's resolved permissions.
    """
    permissions = await get_user_permissions(db, context.user_id, context.node_id)
    return {"permissions": list(permissions)}


@router.post("/switch-node")
async def switch_node(
    request: SwitchNodeRequest,
    response: Response,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Switch to a different node/branch.
    Validates node exists and user has access.
    """
    node_id = request.nodeId

    # Validate node exists
    result = await db.execute(select(Branch).where(Branch.id == node_id))
    branch = result.scalar_one_or_none()

    if not branch:
        raise NotFoundError("Node")

    if not branch.is_active:
        raise AuthError("Node is inactive", status_code=403)

    # Authorization check
    if context.role != "ADMIN":
        # Non-admin must be assigned to this node
        result = await db.execute(
            select(User.node_id).where(User.id == context.user_id)
        )
        user_node = result.scalar_one_or_none()

        if user_node != node_id:
            raise AuthError("No access to this node", status_code=403)

    # Create new token with updated nodeId
    token = create_access_token(
        user_id=context.user_id,
        email=context.email,
        role=context.role,
        node_id=node_id,
        token_version=context.token_version,
    )

    set_session_cookie(response, token)

    return {"ok": True, "nodeId": node_id}


@router.post("/signup")
async def signup(
    request: SignupRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> dict[str, Any]:
    """
    Register a new user.
    """
    # Validate password policy
    valid, error = validate_password_policy(request.password)
    if not valid:
        raise BadRequestError(error or "Invalid password")

    # Resolve tenant for signup
    if not tenant_id:
        t_res = await db.execute(select(Tenant.id).limit(1))
        tenant_id = t_res.scalar_one_or_none()
        if not tenant_id:
            tenant = Tenant(domain="default.local", name="Default Tenant", settings={})
            db.add(tenant)
            await db.flush()
            tenant_id = tenant.id
    else:
        t_chk = await db.execute(select(Tenant.id).where(Tenant.id == tenant_id))
        if not t_chk.scalar_one_or_none():
            t_res = await db.execute(select(Tenant.id).limit(1))
            fallback_id = t_res.scalar_one_or_none()
            if fallback_id:
                tenant_id = fallback_id
            else:
                tenant = Tenant(domain="default.local", name="Default Tenant", settings={})
                db.add(tenant)
                await db.flush()
                tenant_id = tenant.id
    # Check if email or username exists in the target tenant
    email_lower = request.email.lower()
    result = await db.execute(
        select(User).where(
            ((User.email == email_lower) & (User.tenant_id == tenant_id))
            | ((User.username == request.username) & (User.tenant_id == tenant_id))
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise BadRequestError("User with this email or username already exists")

    # Create user
    password_hash = hash_password(request.password)

    user = User(
        email=email_lower,
        username=request.username,
        first_name=request.firstName,
        last_name=request.lastName,
        password_hash=password_hash,
        role=RoleKey.LEARNER,
        active_role=RoleKey.LEARNER,
        tenant_id=tenant_id,
        is_active=True,
    )

    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise BadRequestError("User with this email or username already exists")
    await db.refresh(user)

    return {"ok": True, "userId": user.id}


@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Refresh access token.
    """
    # Get current session
    token = request.cookies.get("session")
    if not token:
        raise AuthError("No session to refresh", status_code=401)

    try:
        payload = await verify_token(token, db)
    except AuthError:
        raise AuthError("Invalid or expired session", status_code=401)

    # Get fresh user data
    result = await db.execute(select(User).where(User.id == payload.get("userId")))
    user = result.scalar_one_or_none()

    if not user:
        raise AuthError("User not found", status_code=401)

    if not user.is_active:
        raise AuthError("Account is disabled", status_code=403)

    # Create new token
    new_token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        tenant_id=user.tenant_id,
        node_id=user.node_id,
        token_version=user.token_version or 0,
    )

    set_session_cookie(response, new_token)

    return {"ok": True, "refreshed": True}


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Request password reset email.
    Always returns success to prevent email enumeration.
    """
    # In production, would send email with reset token
    # For now, just return success
    return {"ok": True, "message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Reset password using reset token.
    """
    # Accept both "newPassword" and legacy "password" for compatibility
    new_password = request.newPassword or request.password or ""

    valid, error = validate_password_policy(new_password)
    if not valid:
        raise BadRequestError(error or "Invalid password")

    # Look up token row, ensure not used and not expired
    token_res = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == request.token)
    )
    prt = token_res.scalar_one_or_none()
    if not prt:
        raise BadRequestError("Invalid reset token")
    if prt.used_at is not None:
        raise BadRequestError("Reset token already used")
    if prt.expires_at and prt.expires_at <= datetime.utcnow():
        raise BadRequestError("Reset token has expired")

    # Load user by composite (tenantId, userId)
    user_res = await db.execute(
        select(User).where((User.id == prt.user_id) & (User.tenant_id == prt.tenant_id))
    )
    user = user_res.scalar_one_or_none()
    if not user:
        raise BadRequestError("User not found for reset token")

    # Update user password and invalidate sessions by incrementing tokenVersion
    user.password_hash = hash_password(new_password)
    user.token_version = (user.token_version or 0) + 1

    # Mark token used
    prt.used_at = datetime.utcnow()

    await db.commit()

    return {"ok": True}
