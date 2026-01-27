import os

import httpx
import pytest

PY_BACKEND = os.environ.get("PY_BACKEND_URL", "http://localhost:8001")
NODE_FRONTEND = os.environ.get("NODE_FRONTEND_URL", "http://localhost:3000")


def normalize(obj):
    if isinstance(obj, dict):
        return {k: normalize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [normalize(v) for v in obj]
    return obj


async def fetch(client: httpx.AsyncClient, url: str):
    r = await client.get(url, timeout=10)
    body = None
    try:
        body = r.json()
    except Exception:
        body = r.text
    return r.status_code, body


@pytest.mark.asyncio
async def test_health_parity():
    async with httpx.AsyncClient() as client:
        pys, py = await fetch(client, f"{PY_BACKEND}/api/health")
        nodes, node = await fetch(client, f"{NODE_FRONTEND}/api/health")
        assert pys == nodes
        assert normalize(py) == normalize(node)


@pytest.mark.asyncio
async def test_users_list_parity():
    async with httpx.AsyncClient() as client:
        pys, py = await fetch(client, f"{PY_BACKEND}/api/users?page=1&limit=5")
        nodes, node = await fetch(client, f"{NODE_FRONTEND}/api/users?page=1&limit=5")
        # If both are unauthorized, compare error envelope
        if (
            pys == 401
            and nodes == 401
            and isinstance(py, dict)
            and isinstance(node, dict)
        ):
            assert "error" in py and "message" in py
            assert "error" in node and "message" in node
            assert py["error"] == node["error"]
        else:
            assert pys == nodes == 200
            assert set(py.keys()) == set(node.keys())
            assert set(py["users"][0].keys()) == set(node["users"][0].keys())
            assert py["page"] == node["page"]
            assert py["limit"] == node["limit"]
