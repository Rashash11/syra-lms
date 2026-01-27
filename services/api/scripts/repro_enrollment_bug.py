import asyncio
import sys

import httpx

BASE_URL = "http://localhost:8001/api"
EMAIL = "admin-a@test.local"
PASSWORD = "TestPass123!"


async def run():
    async with httpx.AsyncClient() as client:
        print(f"Connecting to {BASE_URL}...")

        # 1. Login
        resp = await client.post(
            f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD}
        )
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} {resp.text}")
            return

        # token = resp.json()["accessToken"]
        # headers = {"Authorization": f"Bearer {token}"}
        headers = {}  # Cookie will be sent automatically
        print("Logged in successfully (Cookie set).")

        # 2. Create/Find a temporary course
        course_code = "BUG_REPRO_101"

        # Try to create
        resp = await client.post(
            f"{BASE_URL}/courses",
            json={
                "code": course_code,
                "title": "Bug Repro Course",
                "description": "Temp course",
            },
            headers=headers,
        )

        print(f"POST /courses status: {resp.status_code}")
        if resp.status_code != 200 and resp.status_code != 201:
            print(f"POST response: {resp.text}")

        if resp.status_code in (200, 201):
            course_id = resp.json()["id"]
        else:
            # If failed, maybe it exists? List courses
            resp = await client.get(f"{BASE_URL}/courses", headers=headers)
            courses = resp.json().get("courses", [])
            # print(f"DEBUG: Found {len(courses)} courses: {[c.get('code') for c in courses]}")
            course_id = next(
                (c["id"] for c in courses if c.get("code") == course_code), None
            )

            if not course_id:
                print(f"Could not create or find course. Status: {resp.status_code}")
                print(f"Courses found: {[c.get('code') for c in courses]}")
                return

        print(f"Course ID: {course_id}")

        # 3. Get my user ID
        resp = await client.get(f"{BASE_URL}/me", headers=headers)
        # print(resp.json())
        user_id = resp.json()["user"]["id"]
        print(f"User ID: {user_id}")

        # 4. Enroll self
        resp = await client.post(
            f"{BASE_URL}/courses/{course_id}/enrollments",
            json={"userIds": [user_id]},
            headers=headers,
        )

        if resp.status_code not in (200, 201):
            print(f"Enrollment failed or already exists: {resp.status_code}")

        # 5. Fetch enrollments
        resp = await client.get(
            f"{BASE_URL}/courses/{course_id}/enrollments", headers=headers
        )
        data = resp.json()
        enrollments = data.get("enrollments", [])

        my_enrollment = next((e for e in enrollments if e["userId"] == user_id), None)

        if not my_enrollment:
            print("Enrollment not found in list.")
            return

        print(f"Enrolled At: {my_enrollment.get('enrolledAt')}")

        if my_enrollment.get("enrolledAt") is None:
            print("❌ BUG CONFIRMED: enrolledAt is None")
        else:
            print("✅ Bug not found: enrolledAt is present")


if __name__ == "__main__":
    asyncio.run(run())
