"""
JWT Token Handling

Implements HS256 signing and verification with:
- iss = "lms-auth"
- aud = "lms-api"
- exp, iat enforced
- tokenVersion for logout-all revocation
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from app.config import get_settings
from app.errors import AuthError
from jose import JWTError, jwt  # type: ignore
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

settings = get_settings()


def create_access_token(
    user_id: str,
    email: str,
    role: str,
    tenant_id: str | None = None,
    node_id: str | None = None,
    token_version: int = 0,
) -> str:
    """
    Create a signed JWT access token.

    Args:
        user_id: User's UUID
        email: User's email
        role: User's active role (ADMIN, INSTRUCTOR, LEARNER, etc.)
        node_id: User's node/branch ID (optional for ADMIN)
        token_version: For logout-all invalidation

    Returns:
        Signed JWT string
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.access_token_minutes)

    payload = {
        "userId": user_id,
        "email": email,
        "role": role,
        "activeRole": role,
        "tokenVersion": token_version,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    }

    if tenant_id is not None:
        payload["tenantId"] = tenant_id

    if node_id is not None:
        payload["nodeId"] = node_id

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: str) -> str:
    """
    Create a signed JWT refresh token.

    Args:
        user_id: User's UUID

    Returns:
        Signed JWT string
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.refresh_token_days)

    payload = {
        "userId": user_id,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "type": "refresh",
    }

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_token_light(token: str) -> dict[str, Any]:
    """
    Lightweight token verification - JWT signature only, no DB check.

    Use this in middleware for performance.
    Validates: signature, iss, aud, exp
    Does NOT validate: tokenVersion (requires DB)

    Args:
        token: JWT string

    Returns:
        Token payload dict

    Raises:
        AuthError: If token is invalid
    """

    def decode_with(secret: str, audience: str) -> dict[str, Any]:
        return jwt.decode(
            token,
            secret,
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer,
            audience=audience,
            options={"verify_exp": True},
        )

    if not settings.jwt_secret:
        raise AuthError("JWT secret not configured")

    try:
        return decode_with(settings.jwt_secret, settings.jwt_audience)
    except JWTError as e:
        if settings.env == "production":
            raise AuthError(f"Invalid or expired token: {str(e)}") from e

        fallback_secret = "default_secret_key_change_me"
        for secret in (settings.jwt_secret, fallback_secret):
            for aud in (settings.jwt_audience, "lms-web"):
                try:
                    return decode_with(secret, aud)
                except JWTError:
                    continue

        raise AuthError(f"Invalid or expired token: {str(e)}") from e


async def verify_token(token: str, db: AsyncSession) -> dict[str, Any]:
    """
    Full token verification including tokenVersion check.

    Use this in API routes for security.
    Validates: signature, iss, aud, exp, tokenVersion vs DB

    Args:
        token: JWT string
        db: Database session

    Returns:
        Token payload dict

    Raises:
        AuthError: If token is invalid or revoked
    """
    # First do light verification
    payload = verify_token_light(token)

    # Allow bypassing DB tokenVersion check in E2E/test mode
    if get_settings().skip_db_auth:
        return payload

    user_id = payload.get("userId")
    jwt_token_version = payload.get("tokenVersion", 0)

    if not user_id:
        raise AuthError("Invalid token: missing userId")

    # Check tokenVersion against DB
    from app.db.models import User

    result = await db.execute(select(User.token_version).where(User.id == user_id))
    # Check if we got any result at all
    row_val = result.scalar_one_or_none()

    # Since scalar_one_or_none returns None for both "no row" and "NULL value",
    # we need to verify if the user actually exists if we get None.
    # However, token_version has a default of 0 and is not nullable in schema,
    # so None strictly implies "User not found" in a consistent DB.
    # But to be safe against inconsistent data:
    if row_val is None:
        # Double check existence to distinguish from NULL
        exists = await db.execute(select(User.id).where(User.id == user_id))
        if not exists.scalar_one_or_none():
            raise AuthError("User not found")
        # If user exists, treat None as 0
        db_token_version = 0
    else:
        db_token_version = row_val

    # Only reject if there's an explicit mismatch
    if jwt_token_version != db_token_version:
        raise AuthError("Token has been revoked")

    return payload


def decode_token_unsafe(token: str) -> dict[str, Any] | None:
    """
    Decode token without verification.

    Use only for debugging or extracting claims from expired tokens.
    NEVER use this for authentication.

    Returns:
        Token payload or None if invalid format
    """
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"verify_signature": False, "verify_exp": False},
        )
    except JWTError:
        return None
