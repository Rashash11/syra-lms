import asyncio
import os
import sys

import httpx
from jose import jwt  # type: ignore

# Add current dir to path
sys.path.append(os.getcwd())

BASE_URL = "http://localhost:3000/api"
JWT_SECRET = "your-secret-key-change-in-production"


async def check_api_list():
    # Admin Token
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

    # Simulate the exact frontend request
    params = {
        "page": "1",
        "limit": "10",
        "search": "",
        "sort_by": "createdAt",  # Note: Frontend sends 'createdAt' (camelCase)
        "order": "desc",
    }

    async with httpx.AsyncClient() as client:
        print(f"\n=== API REQUEST: {BASE_URL}/users ===")
        print(f"Params: {params}")

        res = await client.get(f"{BASE_URL}/users", params=params, headers=headers)

        if res.status_code != 200:
            print(f"Error: {res.status_code} {res.text}")
            return

        data = res.json()
        users = data.get("users", [])

        print(f"Total: {data.get('total')}")
        print(f"Returned: {len(users)}")
        print("\n--- Top 3 Users Returned ---")
        for u in users[:3]:
            print(f"ID: {u.get('id')}")
            print(f"Email: {u.get('email')}")
            print(f"CreatedAt: {u.get('createdAt')}")
            print("-" * 20)


if __name__ == "__main__":
    asyncio.run(check_api_list())
