import asyncio
import os
import sys
import time
from typing import Any, Dict, Tuple

import httpx

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
API_ROOT = os.path.dirname(CURRENT_DIR)
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

from app.auth.jwt import create_access_token
from app.db.models import RoleKey, User
from app.db.session import async_session_factory
from sqlalchemy import select

BASE_URL = "http://127.0.0.1:8001"


async def get_admin_token() -> str | None:
    async with async_session_factory() as session:
        # Prefer an ADMIN user
        res = await session.execute(
            select(
                User.id,
                User.email,
                User.active_role,
                User.node_id,
                User.tenant_id,
                User.token_version,
            )
            .where((User.active_role == RoleKey.ADMIN) | (User.role == RoleKey.ADMIN))
            .order_by(User.created_at.asc())
            .limit(1)
        )
        row = res.first()
        if not row:
            # Fallback: first user
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


def summarize(resp: httpx.Response) -> Tuple[int, str]:
    status = resp.status_code
    try:
        data = resp.json()
        snippet = str(data)[:200]
    except Exception:
        snippet = resp.text[:200]
    return status, snippet


async def run() -> None:
    token = await get_admin_token()
    cookies = {"session": token} if token else {}
    async with httpx.AsyncClient(
        base_url=BASE_URL, timeout=20.0, headers={"Content-Type": "application/json"}
    ) as client:
        # 1) Users
        ts = int(time.time())
        user_payload = {
            "email": f"smoke_{ts}@test.com",
            "username": f"smoke_{ts}",
            "firstName": "Smoke",
            "lastName": "Tester",
            "password": "Password123!",
            "role": "LEARNER",
        }
        r = await client.post("/api/users", json=user_payload, cookies=cookies)
        s, snip = summarize(r)
        print(f"POST /api/users | {s} | {snip}")
        user_id = r.json().get("id") if s == 200 else None

        if user_id:
            upd = await client.put(
                f"/api/users/{user_id}",
                json={"firstName": "Smk", "lastName": "Tst"},
                cookies=cookies,
            )
            s, snip = summarize(upd)
            print(f"PUT /api/users/{user_id} | {s} | {snip}")

        # 2) Courses
        course_payload = {"title": f"Smoke Course {ts}", "status": "DRAFT"}
        rc = await client.post("/api/courses", json=course_payload, cookies=cookies)
        s, snip = summarize(rc)
        print(f"POST /api/courses | {s} | {snip}")
        course_id = rc.json().get("id") if s == 200 else None

        if course_id:
            # Create section (courses_editor)
            sec_p = {"title": "Intro Section"}
            rs = await client.post(
                f"/api/courses/{course_id}/sections", json=sec_p, cookies=cookies
            )
            s, snip = summarize(rs)
            print(f"POST /api/courses/{course_id}/sections | {s} | {snip}")
            # Publish and activate course
            ru = await client.put(
                f"/api/courses/{course_id}",
                json={"status": "PUBLISHED", "isActive": True},
                cookies=cookies,
            )
            s, snip = summarize(ru)
            print(f"PUT /api/courses/{course_id} | {s} | {snip}")

        # 3) Enrollment via course editor (uses course:update permission)
        if user_id and course_id:
            re = await client.post(
                f"/api/courses/{course_id}/enrollments",
                json={"userIds": [user_id]},
                cookies=cookies,
            )
            s, snip = summarize(re)
            print(f"POST /api/courses/{course_id}/enrollments | {s} | {snip}")
            rg = await client.get(
                f"/api/courses/{course_id}/enrollments", cookies=cookies
            )
            s, snip = summarize(rg)
            print(f"GET /api/courses/{course_id}/enrollments | {s} | {snip}")

        # 4) Groups
        grp_p = {"name": f"Smoke Group {ts}"}
        rgc = await client.post("/api/groups", json=grp_p, cookies=cookies)
        s, snip = summarize(rgc)
        print(f"POST /api/groups | {s} | {snip}")
        group_id = rgc.json().get("id") if s == 200 else None
        if group_id:
            grg = await client.get(f"/api/groups/{group_id}", cookies=cookies)
            s, snip = summarize(grg)
            print(f"GET /api/groups/{group_id} | {s} | {snip}")
            rmem = await client.post(
                f"/api/groups/{group_id}/members",
                json={"userId": user_id},
                cookies=cookies,
            )
            s, snip = summarize(rmem)
            print(f"POST /api/groups/{group_id}/members | {s} | {snip}")
            rcrs = await client.post(
                f"/api/groups/{group_id}/courses",
                json={"courseId": course_id},
                cookies=cookies,
            )
            s, snip = summarize(rcrs)
            print(f"POST /api/groups/{group_id}/courses | {s} | {snip}")
            gl = await client.get("/api/groups?limit=50", cookies=cookies)
            gs, gsnip = summarize(gl)
            print(f"GET /api/groups | {gs} | {gsnip}")

        # 5) Password reset
        if user_payload.get("email"):
            rf = await client.post(
                "/api/auth/forgot-password",
                json={"email": user_payload["email"]},
                cookies=cookies,
            )
            s, snip = summarize(rf)
            print(f"POST /api/auth/forgot-password | {s} | {snip}")
            # Create reset token directly in DB (email does not return token)
            from datetime import datetime, timedelta
            from uuid import uuid4

            from app.db.models import PasswordResetToken

            async with async_session_factory() as session:
                # Resolve tenantId for smoke user
                u = await session.execute(
                    select(User.tenant_id).where(User.id == user_id)
                )
                t_id = u.scalar()
                token_value = f"tok-{uuid4()}"
                prt = PasswordResetToken(
                    tenant_id=t_id,
                    user_id=user_id,
                    token=token_value,
                    expires_at=datetime.utcnow() + timedelta(hours=1),
                )
                session.add(prt)
                await session.commit()
            rr = await client.post(
                "/api/auth/reset-password",
                json={"token": token_value, "password": "NewPassword123!"},
                cookies=cookies,
            )
            s, snip = summarize(rr)
            print(f"POST /api/auth/reset-password | {s} | {snip}")
            # Attempt login with new password
            rl = await client.post(
                "/api/auth/login",
                json={"email": user_payload["email"], "password": "NewPassword123!"},
            )
            s, snip = summarize(rl)
            print(f"POST /api/auth/login | {s} | {snip}")

        # 1c) Clean up user
        if user_id:
            rd = await client.delete(f"/api/users/{user_id}", cookies=cookies)
            s, snip = summarize(rd)
            print(f"DELETE /api/users/{user_id} | {s} | {snip}")


if __name__ == "__main__":
    asyncio.run(run())
