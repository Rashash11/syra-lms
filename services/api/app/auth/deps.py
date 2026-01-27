"""
Authentication Dependencies

FastAPI dependencies for extracting and validating auth context.
"""

from dataclasses import dataclass
from typing import Annotated

from app.auth.jwt import verify_token, verify_token_light
from app.db.session import get_db
from app.errors import AuthError
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class AuthContext:
    """
    Authenticated user context.

    This is extracted from the verified JWT and passed to route handlers.
    """

    user_id: str
    email: str
    role: str
    tenant_id: str | None = None
    node_id: str | None = None
    token_version: int = 0


def get_session_cookie(request: Request) -> str | None:
    token = request.cookies.get("session") or request.cookies.get("refreshToken")
    if token:
        return token
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth[7:]
    x_session = request.headers.get("x-session")
    if x_session:
        return x_session
    return None


async def get_auth_context_optional(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthContext | None:
    """
    Get auth context if authenticated, None otherwise.

    Use this for endpoints that support both authenticated and anonymous access.
    """
    token = get_session_cookie(request)
    if not token:
        return None

    try:
        payload = await verify_token(token, db)
        return AuthContext(
            user_id=payload.get("userId", ""),
            email=payload.get("email", ""),
            role=payload.get("role") or payload.get("activeRole") or "LEARNER",
            tenant_id=payload.get("tenantId"),
            node_id=payload.get("nodeId"),
            token_version=payload.get("tokenVersion", 0),
        )
    except AuthError:
        return None


async def require_auth(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AuthContext:
    """
    Require authentication - raises 401 if not authenticated.

    Use this as a dependency for protected endpoints.

    Example:
        @router.get("/me")
        async def get_me(context: AuthContext = Depends(require_auth)):
            return {"userId": context.user_id}
    """
    token = get_session_cookie(request)
    if not token:
        raise AuthError("Authentication required", status_code=401)

    payload = await verify_token(token, db)
    return AuthContext(
        user_id=payload.get("userId", ""),
        email=payload.get("email", ""),
        role=payload.get("role") or payload.get("activeRole") or "LEARNER",
        tenant_id=payload.get("tenantId"),
        node_id=payload.get("nodeId"),
        token_version=payload.get("tokenVersion", 0),
    )


async def require_auth_light(request: Request) -> AuthContext:
    """
    Lightweight auth check without DB validation.

    Use for middleware or high-performance endpoints where
    tokenVersion staleness is acceptable.
    """
    token = get_session_cookie(request)
    if not token:
        # Check for Authorization header case-insensitive
        auth = request.headers.get("Authorization") or request.headers.get(
            "authorization"
        )
        if auth and auth.lower().startswith("bearer "):
            token = auth[7:]

    if not token:
        raise AuthError("Authentication required", status_code=401)

    payload = verify_token_light(token)

    return AuthContext(
        user_id=payload.get("userId", ""),
        email=payload.get("email", ""),
        role=payload.get("role") or payload.get("activeRole") or "LEARNER",
        tenant_id=payload.get("tenantId"),
        node_id=payload.get("nodeId"),
        token_version=payload.get("tokenVersion", 0),
    )


# Type alias for dependency injection
RequireAuth = Annotated[AuthContext, Depends(require_auth)]
OptionalAuth = Annotated[AuthContext | None, Depends(get_auth_context_optional)]
