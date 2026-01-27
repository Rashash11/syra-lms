import asyncio
import os
import sys

# Add the parent directory to sys.path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.auth.jwt import create_access_token
from app.db.session import engine, async_session_factory
from sqlalchemy import select
from app.db.models import User

def test_all_users():
    print("Starting exhaustive test of dashboard for ALL users...")
    
    users_to_test = []
    
    async def fetch_users():
        async with async_session_factory() as session:
            result = await session.execute(select(User))
            users = result.scalars().all()
            for u in users:
                users_to_test.append({
                    "id": str(u.id),
                    "email": u.email,
                    "tenant_id": str(u.tenant_id),
                    "role": u.role
                })
        await engine.dispose()

    # Fetch users first
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(fetch_users())
    
    print(f"Found {len(users_to_test)} users. Testing dashboard for each...")
    
    client = TestClient(app, raise_server_exceptions=False) # Don't raise, we want to check status code
    
    failures = []
    
    for i, u in enumerate(users_to_test):
        print(f"[{i+1}/{len(users_to_test)}] Testing user {u['email']} ({u['id']})...", end="", flush=True)
        
        token = create_access_token(
            user_id=u["id"],
            email=u["email"],
            role=u["role"],
            tenant_id=u["tenant_id"]
        )
        
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = client.get("/api/dashboard", headers=headers)
            if response.status_code != 200:
                print(f" FAILED: {response.status_code}")
                print(f"Response: {response.text}")
                failures.append((u, response.status_code, response.text))
            else:
                print(" OK")
        except Exception as e:
            print(f" EXCEPTION: {e}")
            failures.append((u, "EXCEPTION", str(e)))

    print("\n\nTest Complete.")
    if failures:
        print(f"Found {len(failures)} failures:")
        for f in failures:
            print(f"User: {f[0]['email']}, Status: {f[1]}")
            # print(f"Body: {f[2]}")
    else:
        print("All users passed!")

if __name__ == "__main__":
    test_all_users()
