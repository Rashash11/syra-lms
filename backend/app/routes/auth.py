"""
Authentication Routes

Login, logout, signup, and user management endpoints.
"""

from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

from app.auth import RequireAuth, create_access_token, hash_password, verify_password
from app.config import get_settings
from app.db.models import RoleKey, Tenant, User, UserStatus
from app.db.session import get_db
from app.errors import AuthError, BadRequestError, ConflictError, NotFoundError
from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

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
    username: str | None = None
    password: str
    firstName: str
    lastName: str
    tenantDomain: str = "default"


class SignupResponse(BaseModel):
    ok: bool = True
    userId: str
    message: str = "Account created successfully"


class MeResponse(BaseModel):
    ok: bool = True
    claims: dict[str, Any]
    user: dict[str, Any]


class LogoutResponse(BaseModel):
    ok: bool = True
    message: str = "Logged out successfully"


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

@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Authenticate user and return JWT token."""
    
    # Find user by email
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise AuthError("Invalid email or password")
    
    if user.status != UserStatus.ACTIVE:
        raise AuthError("Account is not active")
    
    # Create JWT token
    token_data = {
        "userId": user.id,
        "tenantId": user.tenant_id,
        "role": user.role.value,
        "activeRole": user.active_role.value if user.active_role else user.role.value,
        "tokenVersion": user.token_version,
    }
    
    access_token = create_access_token(token_data)
    
    # Set cookie
    set_session_cookie(response, access_token)
    
    # Update last login
    await db.execute(
        update(User)
        .where(User.id == user.id)
        .values(last_login_at=datetime.now(timezone.utc))
    )
    await db.commit()
    
    return LoginResponse(
        userId=user.id,
        role=user.role.value,
        activeRole=user.active_role.value if user.active_role else user.role.value,
    )


@router.post("/signup", response_model=SignupResponse)
async def signup(
    request: SignupRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create a new user account."""
    
    # Check if user already exists
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise ConflictError("User with this email already exists")
    
    # Get or create tenant
    tenant_stmt = select(Tenant).where(Tenant.domain == request.tenantDomain)
    tenant_result = await db.execute(tenant_stmt)
    tenant = tenant_result.scalar_one_or_none()
    
    if not tenant:
        # Create default tenant
        tenant = Tenant(
            domain=request.tenantDomain,
            name=request.tenantDomain.title(),
            settings={}
        )
        db.add(tenant)
        await db.flush()
    
    # Create user
    user = User(
        tenant_id=tenant.id,
        email=request.email,
        username=request.username,
        password_hash=hash_password(request.password),
        first_name=request.firstName,
        last_name=request.lastName,
        role=RoleKey.LEARNER,
        status=UserStatus.ACTIVE,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return SignupResponse(userId=user.id)


@router.get("/me", response_model=MeResponse)
async def get_current_user_info(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get current user information."""
    
    # Get user details
    stmt = select(User).where(User.id == context.user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundError("User")
    
    claims = {
        "userId": context.user_id,
        "tenantId": context.tenant_id,
        "role": context.role,
        "tokenVersion": context.token_version,
    }
    
    user_data = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "fullName": user.full_name,
        "role": user.role.value,
        "activeRole": user.active_role.value if user.active_role else user.role.value,
        "status": user.status.value,
        "lastLoginAt": user.last_login_at.isoformat() if user.last_login_at else None,
        "createdAt": user.created_at.isoformat(),
    }
    
    return MeResponse(claims=claims, user=user_data)


@router.post("/logout", response_model=LogoutResponse)
async def logout(response: Response):
    """Logout user by clearing session cookie."""
    clear_session_cookie(response)
    return LogoutResponse()


@router.post("/logout-all", response_model=LogoutResponse)
async def logout_all(
    context: RequireAuth,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Logout from all devices by incrementing token version."""
    
    # Increment token version to invalidate all tokens
    await db.execute(
        update(User)
        .where(User.id == context.user_id)
        .values(token_version=User.token_version + 1)
    )
    await db.commit()
    
    # Clear current session cookie
    clear_session_cookie(response)
    
    return LogoutResponse(message="Logged out from all devices")