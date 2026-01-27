import asyncio
import os
import sys

import httpx
from sqlalchemy import select

# Add current dir to path
sys.path.append(os.getcwd())

from app.auth.jwt import create_access_token
from app.db.models import Course, RoleKey, User
from app.db.session import async_session_factory


async def debug_create_unit():
    async with async_session_factory() as db:
        # 1. Get Admin User
        result = await db.execute(
            select(User).where(User.role == RoleKey.ADMIN).limit(1)
        )
        user = result.scalar_one_or_none()
        if not user:
            print("No admin user found")
            return

        print(f"Using Admin: {user.email} ({user.id})")

        # 2. Generate Token
        token = create_access_token(
            user_id=user.id,
            email=user.email,
            role=user.role.value,
            tenant_id=user.tenant_id,
            node_id=user.node_id,
        )
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Get or Create Course
        result = await db.execute(select(Course).limit(1))
        course = result.scalar_one_or_none()
        if not course:
            print("No course found, cannot test unit creation without a course.")
            # In a real scenario we'd create one, but let's assume one exists or fail
            return

        course_id = course.id
        print(f"Using Course: {course.title} ({course_id})")

        # 4. Call API to Create Video Unit
        async with httpx.AsyncClient(base_url="http://localhost:8001") as client:
            # Check Health
            resp_health = await client.get("/api/health")
            print(f"Health Check: {resp_health.status_code} {resp_health.text}")

            # Test simple route
            resp_test = await client.get("/api/cedit/test")
            print(f"GET /api/cedit/test: {resp_test.status_code} {resp_test.text}")

            # Test direct route
            resp_direct = await client.get("/api/courses/direct-test")
            print(
                f"GET /api/courses/direct-test: {resp_direct.status_code} {resp_direct.text}"
            )

            # Test ztest route
            resp_ztest = await client.get("/api/ztest/test")
            print(f"GET /api/ztest/test: {resp_ztest.status_code} {resp_ztest.text}")

            # Test existing courses route
            resp_course = await client.get(f"/api/courses/{course.id}", headers=headers)
            print(f"GET /api/courses/{course.id}: {resp_course.status_code}")

            # Test GET first
            resp_get = await client.get(
                f"/api/cedit/{course_id}/units", headers=headers
            )
            print(f"GET /api/cedit/{course_id}/units Status: {resp_get.status_code}")
            print(f"GET Response: {resp_get.text}")

            payload = {
                "type": "VIDEO",
                "title": "Debug Video Unit",
                "config": {"source": "youtube"},
                "status": "DRAFT",
            }

            print(f"Sending POST /api/cedit/{course_id}/units with payload: {payload}")
            try:
                response = await client.post(
                    f"/api/cedit/{course_id}/units", json=payload, headers=headers
                )

                print(f"Response Status: {response.status_code}")
                print(f"Response URL: {response.url}")
                print(f"Response History: {response.history}")
                if response.status_code == 200:
                    data = response.json()
                    print("Response Data:", data)

                    if data.get("type") == "VIDEO":
                        print("SUCCESS: Unit created with type VIDEO")
                    else:
                        print(f"FAILURE: Unit created with type {data.get('type')}")
                else:
                    print("Error Response:", response.text)

            except Exception as e:
                print(f"Request Failed: {e}")


if __name__ == "__main__":
    asyncio.run(debug_create_unit())
