import os

import httpx
import pytest

PY_BACKEND = os.environ.get("PY_BACKEND_URL", "http://localhost:8001")
NODE_FRONTEND = os.environ.get("NODE_FRONTEND_URL", "http://localhost:3000")

AUTH_COOKIE = os.environ.get("AUTH_COOKIE")  # e.g., session cookie value
REFRESH_COOKIE = os.environ.get("REFRESH_COOKIE")  # optional refresh token


def _cookie_headers():
    cookies = []
    if AUTH_COOKIE:
        cookies.append(f"session={AUTH_COOKIE}")
    if REFRESH_COOKIE:
        cookies.append(f"refreshToken={REFRESH_COOKIE}")
    if not cookies:
        return {}
    return {"Cookie": "; ".join(cookies)}


@pytest.mark.skipif(not AUTH_COOKIE, reason="No AUTH_COOKIE provided")
@pytest.mark.asyncio
async def test_users_list_authenticated_parity():
    headers = _cookie_headers()
    async with httpx.AsyncClient() as client:
        py = await client.get(
            f"{PY_BACKEND}/api/users?page=1&limit=5", headers=headers, timeout=10
        )
        node = await client.get(
            f"{NODE_FRONTEND}/api/users?page=1&limit=5", headers=headers, timeout=10
        )
        assert py.status_code == node.status_code == 200
        pjb = py.json()
        njb = node.json()
        # Basic parity checks on envelope
        assert set(pjb.keys()) == set(njb.keys())
        assert pjb.get("page") == njb.get("page")
        assert pjb.get("limit") == njb.get("limit")
        if pjb.get("users") and njb.get("users"):
            assert isinstance(pjb["users"], list) and isinstance(njb["users"], list)
            if len(pjb["users"]) and len(njb["users"]):
                assert set(pjb["users"][0].keys()) == set(njb["users"][0].keys())
