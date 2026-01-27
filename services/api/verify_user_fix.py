# flake8: noqa
import asyncio
import os
import sys
import time

import httpx
from jose import jwt  # type: ignore

# Ensure we can import from app if needed, but we are testing via HTTP
# Just need to make sure dependencies are available.

BASE_URL = "http://localhost:3000/api"
JWT_SECRET = "your-secret-key-change-in-production"


async def run_test():
    token = jwt.encode(
        {
            "userId": "631f91b8-b747-4db9-b156-f14e991bd432",
            "tenantId": "83ad5890-2eff-41cf-86fa-9048eff5ccb9",
            "role": "ADMIN",
            "email": "admin@test.com",
            "iss": "lms-auth",
            "aud": "lms-api",
        },
        JWT_SECRET,
        algorithm="HS256",
    )

    headers = {"Cookie": f"session={token}", "Content-Type": "application/json"}

    timestamp = int(time.time())
    email = f"lifecycle_{timestamp}@test.com"
    username = f"lifecycle_{timestamp}"

    async with httpx.AsyncClient() as client:
        print(f"--- Testing User Lifecycle: {email} ---")

        # 1. Create User
        print("1. Creating User...")
        payload = {
            "firstName": "Test",
            "lastName": "Lifecycle",
            "email": email,
            "username": username,
            "password": "Password123!",
            "role": "LEARNER",
        }
        res = await client.post(f"{BASE_URL}/users", json=payload, headers=headers)
        if res.status_code not in [200, 201]:
            print(f"FAILED to create: {res.status_code} {res.text}")
            return

        user_data = res.json()
        user_id = user_data.get("id")
        print(f"User Created: {user_id}")

        # 2. Delete User
        print("2. Deleting User...")
        res = await client.delete(f"{BASE_URL}/users/{user_id}", headers=headers)
        if res.status_code != 200:
            print(f"FAILED to delete: {res.status_code} {res.text}")
            return
        print("User Deleted.")

        # 3. Create Again (Restore)
        print("3. Re-creating User (Restore)...")
        payload["firstName"] = "TestRestored"
        res = await client.post(f"{BASE_URL}/users", json=payload, headers=headers)
        if res.status_code not in [200, 201]:
            print(f"FAILED to restore: {res.status_code} {res.text}")
            return

        restored_data = res.json()
        print(f"User Restored: {restored_data.get('firstName')}")

        if restored_data.get("firstName") != "TestRestored":
            print("ERROR: User details not updated.")

        # 3.5 Check specific user details
        print(f"Fetching User {user_id} directly...")
        res = await client.get(f"{BASE_URL}/users/{user_id}", headers=headers)
        if res.status_code == 200:
            u = res.json()
            print(
                f"User Details: Role={u.get('role')}, Status={u.get('status')}, Node={u.get('nodeId')}"
            )
        else:
            print(f"Failed to fetch user: {res.status_code}")

        # 4. List Users with Role Filter
        print("4. Listing Users (Role=LEARNER)...")
        res = await client.get(f"{BASE_URL}/users?role=LEARNER", headers=headers)
        data = res.json()
        users = data.get("users", [])
        print(f"Total Users: {data.get('total')}, Returned: {len(users)}")
        print(f"All IDs: {[u['id'] for u in users]}")
        print(f"Looking for: {user_id}")
        found = any(u["id"] == user_id for u in users)
        print(f"Found restored user ({user_id}) in LEARNER list: {found}")

        print("5. Listing Users (Role=INSTRUCTOR)...")
        res = await client.get(f"{BASE_URL}/users?role=INSTRUCTOR", headers=headers)
        data = res.json()
        users = data.get("users", [])
        print(f"Total Users: {data.get('total')}, Returned: {len(users)}")
        found_wrong = any(u["id"] == user_id for u in users)
        print(
            f"Found restored user in INSTRUCTOR list: {found_wrong} (Should be False)"
        )

        if found and not found_wrong:
            print("\nSUCCESS: All checks passed!")
        else:
            print("\nFAILURE: Role filtering checks failed.")


if __name__ == "__main__":
    try:
        asyncio.run(run_test())
    except ImportError as e:
        print(
            f"Missing dependency: {e}. Please run in environment with requirements.txt installed."
        )
