from typing import Annotated, Any

from app.auth import create_access_token
from app.auth.deps import AuthContext, require_auth_light
from app.config import get_settings
from app.db.models import User
from app.db.session import get_db
from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()
settings = get_settings()


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="session",
        value=token,
        httponly=settings.cookie_httponly,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
        path="/",
        max_age=settings.access_token_expire_seconds,
    )


@router.get("/me")
async def get_me(
    context: Annotated[AuthContext, Depends(require_auth_light)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    role_value = context.role

    # Use ORM to fetch user
    result = await db.execute(select(User).where(User.id == context.user_id))
    user = result.scalar_one_or_none()

    if user:
        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "roles": [role_value],
                "activeRole": role_value,
            }
        }

    # Minimal fallback using token only
    return {
        "user": {
            "id": context.user_id,
            "email": context.email,
            "username": "",
            "firstName": "",
            "lastName": "",
            "roles": [role_value],
            "activeRole": role_value,
        }
    }


@router.post("/me/switch-role")
async def switch_role(
    body: dict[str, str],
    response: Response,
    context: Annotated[AuthContext, Depends(require_auth_light)],
) -> dict[str, Any]:
    role = body.get("role", context.role)
    token = create_access_token(
        user_id=context.user_id,
        email=context.email,
        role=role,
        tenant_id=context.tenant_id,
        node_id=context.node_id,
        token_version=context.token_version or 0,
    )
    _set_session_cookie(response, token)
    redirect = "/learner"
    if role == "ADMIN":
        redirect = "/admin"
    elif role == "SUPER_INSTRUCTOR":
        redirect = "/super-instructor"
    elif role == "INSTRUCTOR":
        redirect = "/instructor"
    return {"success": True, "redirectUrl": redirect}
