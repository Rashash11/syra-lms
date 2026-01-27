"""
Authentication Utilities

JWT token creation, verification, and password handling.
"""

from datetime import datetime, timedelta, timezone
from typing import Annotated, Any, Dict

from app.config import get_settings
from app.db.models import User
from app.db.session import get_db
from app.errors import AuthError
from fastapi import Depends, Request
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============= Password Utilities =============

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def validate_password_policy(password: str) -> bool:
    """Validate password meets policy requirements."""
    if len(password) < 8:
        return False
    # Add more validation rules as needed
    return True


# ============= JWT Utilities =============

def create_access_token(data: Dict[str, Any], expires_delta: timedelta = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
        )
        return payload
    except JWTError as e:
        raise AuthError(f"Invalid token: {str(e)}")


# ============= Authentication Dependencies =============

class AuthContext:
    """Authentication context for requests."""
    
    def __init__(self, user_id: str, tenant_id: str, role: str, token_version: int = 0):
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.role = role
        self.token_version = token_version


async def get_current_user(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> AuthContext:
    """Get current authenticated user from JWT token."""
    
    # Get token from cookie
    token = request.cookies.get("session")
    if not token:
        raise AuthError("No authentication token provided")
    
    # Verify token
    try:
        payload = verify_token(token)
    except AuthError:
        raise AuthError("Invalid or expired token")
    
    # Extract claims
    user_id = payload.get("userId")
    tenant_id = payload.get("tenantId")
    role = payload.get("role")
    token_version = payload.get("tokenVersion", 0)
    
    if not user_id or not tenant_id or not role:
        raise AuthError("Invalid token claims")
    
    # Verify user exists and token version
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise AuthError("User not found")
    
    if user.token_version != token_version:
        raise AuthError("Token has been revoked")
    
    return AuthContext(
        user_id=user_id,
        tenant_id=tenant_id,
        role=role,
        token_version=token_version
    )


# Type alias for dependency injection
RequireAuth = Annotated[AuthContext, Depends(get_current_user)]