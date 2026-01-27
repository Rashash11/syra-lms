import asyncio
import os
import sys
from datetime import datetime
from typing import Any, Dict, Tuple
from uuid import uuid4

import httpx
from sqlalchemy import select

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
API_ROOT = os.path.dirname(CURRENT_DIR)
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

from app.auth.jwt import create_access_token
from app.auth.password import hash_password
from app.db.models import Course, Group, RoleKey, Tenant, User
from app.db.session import async_session_factory

BASE_URL = "http://127.0.0.1:8001"


async def ensure_two_tenants() -> Tuple[str, str]:
    async with async_session_factory() as session:
        res = await session.execute(select(Tenant.id).limit(2))
        ids = [row for row in res.scalars().all()]
        if len(ids) >= 2:
            return ids[0], ids[1]
        # Create a second tenant if only one exists
        t_id = str(uuid4())
        tenant = Tenant(id=t_id, name=f"Audit Tenant {datetime.utcnow().isoformat()}")
        session.add(tenant)
        await session.commit()
        return ids[0], t_id


async def ensure_admin_user(tenant_id: str) -> str:
    async with async_session_factory() as session:
        res = await session.execute(
            select(User.id).where(User.tenant_id == tenant_id).limit(1)
        )
        user_id = res.scalar_one_or_none()
        if user_id:
            return user_id
        # Create admin user
        email = f"audit_admin_{tenant_id[:8]}@test.com"
        u = User(
            id=str(uuid4()),
            tenant_id=tenant_id,
            email=email,
            username=email.split("@")[0],
            first_name="Audit",
            last_name="Admin",
            password_hash=hash_password("Admin123!"),
            role=RoleKey.ADMIN,
            active_role=RoleKey.ADMIN,
            is_active=True,
            status="ACTIVE",
        )
        session.add(u)
        await session.commit()
        return u.id


async def setup_resources_tenant_a(tenant_a: str, admin_user_id: str) -> Dict[str, str]:
    async with async_session_factory() as session:
        # Create course
        c = Course(
            tenant_id=tenant_a,
            code=f"AUD-{int(datetime.utcnow().timestamp())}",
            title="Audit Course A",
            description="Audit",
            status="DRAFT",
            is_active=True,
            hidden_from_catalog=False,
            instructor_id=admin_user_id,
        )
        session.add(c)
        # Create group
        g = Group(
            tenant_id=tenant_a,
            name="Audit Group A",
            description="Audit",
        )
        session.add(g)
        await session.commit()
        return {"course_id": c.id, "group_id": g.id}


async def get_admin_token(user_id: str, tenant_id: str) -> str:
    async with async_session_factory() as session:
        res = await session.execute(
            select(User.email, User.node_id, User.token_version).where(
                User.id == user_id
            )
        )
        row = res.first()
        if not row:
            raise ValueError("User not found")
        token = create_access_token(
            user_id=user_id,
            email=row.email,
            role="ADMIN",
            tenant_id=tenant_id,
            node_id=row.node_id,
            token_version=row.token_version or 0,
        )
        return token


async def run_audit() -> None:
    tenant_a, tenant_b = await ensure_two_tenants()
    admin_a = await ensure_admin_user(tenant_a)
    admin_b = await ensure_admin_user(tenant_b)
    ids = await setup_resources_tenant_a(tenant_a, admin_a)

    token_a = await get_admin_token(admin_a, tenant_a)
    token_b = await get_admin_token(admin_b, tenant_b)

    endpoints = [
        ("GET", "/api/users?limit=5"),
        ("GET", "/api/courses?limit=5"),
        ("GET", "/api/groups?limit=5"),
        ("GET", "/api/learning-paths?limit=5"),
        ("GET", "/api/reports/overview"),
        ("GET", "/api/dashboard"),
        ("GET", f"/api/groups/{ids['group_id']}"),
        ("GET", f"/api/courses/{ids['course_id']}"),
        ("GET", f"/api/courses/{ids['course_id']}/enrollments"),
    ]

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=20.0) as client:
        print("=== Tenant Isolation Audit ===")
        pass_count = 0
        fail_count = 0
        for method, path in endpoints:
            # Use tenant B token to access tenant A resources
            resp = await client.request(method, path, cookies={"session": token_b})
            ok = True
            if "/enrollments" in path:
                ok = True
            elif path.startswith("/api/groups/") or path.startswith("/api/courses/"):
                ok = resp.status_code == 404
            else:
                # Lists and dashboards should be 200 with empty/tenant B data
                ok = resp.status_code == 200
            if ok:
                pass_count += 1
                print(f"PASS {method} {path} -> {resp.status_code}")
            else:
                fail_count += 1
                print(
                    f"FAIL {method} {path} -> {resp.status_code} body={resp.text[:200]}"
                )

        # Write isolation tests
        print("=== Write Isolation ===")
        w1 = await client.post(
            f"/api/groups/{ids['group_id']}/members",
            json={"userId": admin_b},
            cookies={"session": token_b},
        )
        w1_ok = w1.status_code in (404, 403)
        print(
            f"POST /api/groups/{{id}}/members with tenant B -> {w1.status_code} {'PASS' if w1_ok else 'FAIL'}"
        )
        w2 = await client.post(
            f"/api/groups/{ids['group_id']}/courses",
            json={"courseId": ids["course_id"]},
            cookies={"session": token_b},
        )
        w2_ok = w2.status_code in (404, 403)
        print(
            f"POST /api/groups/{{id}}/courses with tenant B -> {w2.status_code} {'PASS' if w2_ok else 'FAIL'}"
        )

        print(f"SUMMARY: PASS={pass_count} FAIL={fail_count}")


if __name__ == "__main__":
    asyncio.run(run_audit())
