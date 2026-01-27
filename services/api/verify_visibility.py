# flake8: noqa
import asyncio
import os
import sys
import time

import httpx
from jose import jwt  # type: ignore

BASE_URL = "http://localhost:3000/api"
JWT_SECRET = "your-secret-key-change-in-production"


async def run_test():
    # Use the same Tenant ID as the Admin
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
    email = f"invisible_{timestamp}@test.com"
    username = f"invisible_{timestamp}"

    async with httpx.AsyncClient() as client:
        print(f"--- Testing Visibility: {email} ---")

        # 1. Create User
        print("1. Creating User...")
        payload = {
            "firstName": "Invisible",
            "lastName": "Man",
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

        # 2. List Users (Page 1)
        print("2. Listing Users (Page 1)...")
        res = await client.get(f"{BASE_URL}/users?page=1&limit=10", headers=headers)
        if res.status_code != 200:
            print(f"FAILED to list: {res.status_code} {res.text}")
            return

        data = res.json()
        users = data.get("users", [])
        total = data.get("total", 0)
        print(f"Total Users: {total}")
        print(f"Returned Users: {len(users)}")

        found = False
        for u in users:
            if u["id"] == user_id:
                found = True
                print(f"FOUND: {u['firstName']} {u['lastName']} ({u['email']})")
                break

        if not found:
            print("ERROR: User NOT found in Page 1 list!")
            print("Top 3 users returned:")
            for u in users[:3]:
                print(
                    f" - {u['firstName']} {u['lastName']} (Created: {u.get('createdAt')})"
                )
        else:
            print("SUCCESS: User is visible.")


if __name__ == "__main__":
    asyncio.run(run_test())
