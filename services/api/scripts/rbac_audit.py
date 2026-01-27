import asyncio
import os
import sys
from typing import Tuple
from uuid import uuid4

import httpx
from sqlalchemy import select

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
API_ROOT = os.path.dirname(CURRENT_DIR)
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.db.models import RoleKey, Tenant, User
from app.db.session import async_session_factory

BASE_URL = "http://127.0.0.1:8001"


async def ensure_user_with_role(tenant_id: str, role: RoleKey) -> str:
    async with async_session_factory() as session:
        res = await session.execute(
            select(User.id)
            .where(User.tenant_id == tenant_id, User.active_role == role)
            .limit(1)
        )
        uid = res.scalar_one_or_none()
        if uid:
            return uid
        email = f"rbac_{role.name.lower()}_{uuid4().hex[:8]}@test.com"
        u = User(
            id=str(uuid4()),
            tenant_id=tenant_id,
            email=email,
            username=email.split("@")[0],
            first_name="RBAC",
            last_name=role.name,
            password_hash=hash_password("Password123!"),
            role=role,
            active_role=role,
            is_active=True,
            status="ACTIVE",
        )
        session.add(u)
        await session.commit()
        return u.id


async def get_token(user_id: str, tenant_id: str, role_name: str) -> str:
    async with async_session_factory() as session:
        res = await session.execute(
            select(User.email, User.node_id, User.token_version).where(
                User.id == user_id
            )
        )
        row = res.first()
        if not row:
            raise ValueError("User not found")
        return create_access_token(
            user_id=user_id,
            email=row.email,
            role=role_name,
            tenant_id=tenant_id,
            node_id=row.node_id,
            token_version=row.token_version or 0,
        )


async def run_audit() -> None:
    async with async_session_factory() as session:
        t_res = await session.execute(select(Tenant.id).limit(1))
        tenant_id = t_res.scalar_one()

    admin_id = await ensure_user_with_role(tenant_id, RoleKey.ADMIN)
    learner_id = await ensure_user_with_role(tenant_id, RoleKey.LEARNER)
    admin_token = await get_token(admin_id, tenant_id, "ADMIN")
    learner_token = await get_token(learner_id, tenant_id, "LEARNER")

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=20.0) as client:
        print("=== RBAC Audit ===")
        tests = [
            # (method, path, body, role_cookie, expected_status)
            ("POST", "/api/courses", {"title": "RBAC Course"}, "LEARNER", 403),
            ("POST", "/api/groups", {"name": "RBAC Group"}, "LEARNER", 403),
            ("GET", "/api/users?limit=5", None, "LEARNER", 403),
            ("POST", "/api/courses", {"title": "RBAC Course Admin"}, "ADMIN", 200),
            ("POST", "/api/groups", {"name": "RBAC Group Admin"}, "ADMIN", 200),
            ("GET", "/api/users?limit=5", None, "ADMIN", 200),
        ]
        cookies_map = {
            "ADMIN": {"session": admin_token},
            "LEARNER": {"session": learner_token},
        }
        pass_count = 0
        fail_count = 0
        for method, path, body, role, exp in tests:
            resp = await client.request(
                method, path, cookies=cookies_map[role], json=body
            )
            ok = resp.status_code == exp
            if ok:
                pass_count += 1
                print(f"PASS {role} {method} {path} -> {resp.status_code}")
            else:
                fail_count += 1
                print(
                    f"FAIL {role} {method} {path} -> {resp.status_code} (expected {exp}) body={resp.text[:200]}"
                )
        print(f"SUMMARY: PASS={pass_count} FAIL={fail_count}")


if __name__ == "__main__":
    asyncio.run(run_audit())
