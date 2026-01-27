import os

import httpx
import pytest

PY_BACKEND = os.environ.get("PY_BACKEND_URL", "http://localhost:8001")


@pytest.mark.parametrize("path", ["/api/health"])
def test_health(path):
    r = httpx.get(f"{PY_BACKEND}{path}", timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert "status" in body or "ok" in body
