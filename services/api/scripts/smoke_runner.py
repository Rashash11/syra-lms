import asyncio
import os
import sys
from typing import List, Tuple

import httpx

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
API_ROOT = os.path.dirname(CURRENT_DIR)
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

from app.auth.jwt import create_access_token
from app.db.models import User
from app.db.session import async_session_factory
from sqlalchemy import select

BASE_URL = "http://127.0.0.1:8001"

ENDPOINTS: List[Tuple[str, str]] = [
    ("GET", "/api/auth/me"),
    ("GET", "/api/users?limit=5"),
    ("GET", "/api/courses?limit=5"),
    ("GET", "/api/groups?limit=5"),
    ("GET", "/api/learning-paths?limit=5"),
    ("GET", "/api/reports/overview"),
    ("GET", "/api/dashboard"),
]


async def get_token() -> str | None:
    async with async_session_factory() as session:
        res = await session.execute(
            select(
                User.id,
                User.email,
                User.active_role,
                User.node_id,
                User.tenant_id,
                User.token_version,
            )
            .order_by(User.created_at.asc())
            .limit(1)
        )
        row = res.first()
        if not row:
            return None
        role_value = (
            row.active_role.value
            if hasattr(row.active_role, "value")
            else str(row.active_role)
        )
        token = create_access_token(
            user_id=row.id,
            email=row.email,
            role=role_value,
            tenant_id=row.tenant_id,
            node_id=row.node_id,
            token_version=row.token_version or 0,
        )
        return token


async def run_smoke() -> None:
    token = await get_token()
    cookies = {"session": token} if token else {}
    results = []
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        for method, path in ENDPOINTS:
            try:
                resp = await client.request(method, path, cookies=cookies)
                ct = resp.headers.get("content-type", "")
                body = None
                err_summary = ""
                if "application/json" in ct:
                    try:
                        body = resp.json()
                    except Exception:
                        body = {"_raw": resp.text[:512]}
                else:
                    body = {"_raw": resp.text[:512]}
                if resp.status_code >= 400:
                    err_summary = (
                        body.get("message") or body.get("error") or str(body)[:200]
                    )
                results.append((path, resp.status_code, err_summary))
            except Exception as e:
                results.append((path, 0, f"request_failed: {e}"))

    print("endpoint | status | error")
    for path, status, err in results:
        print(f"{path} | {status} | {err}")


if __name__ == "__main__":
    asyncio.run(run_smoke())
