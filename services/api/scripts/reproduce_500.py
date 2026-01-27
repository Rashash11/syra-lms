import asyncio
import os
import sys

# Add the parent directory to sys.path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.auth.jwt import create_access_token
from app.db.session import engine, async_session_factory
from sqlalchemy import text, select
from app.db.models import User

def reproduce():
    # 1. Get a valid user to generate token
    # We need to run async code to query DB, but TestClient is synchronous (it runs async app in thread/loop).
    # However, to get the user, we need async.
    
    async def get_user_and_token():
        async with async_session_factory() as session:
            # Find an admin user
            result = await session.execute(select(User).limit(1))
            user = result.scalars().first()
            if not user:
                print("No user found! Cannot test.")
                return None, None
            
            print(f"Found user: {user.id} ({user.email})")
            token = create_access_token(
                user_id=str(user.id),
                email=user.email,
                role="ADMIN", # Assume admin for dashboard
                tenant_id=str(user.tenant_id)
            )
        # Close engine connections to avoid loop mismatch with TestClient
        await engine.dispose()
        return user, token

    # Run async setup
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    user, token = loop.run_until_complete(get_user_and_token())
    
    if not token:
        return

    print(f"Generated token: {token[:20]}...")

    # 2. Use TestClient to call endpoint
    # raise_server_exceptions=True will let the exception propagate out so we see the traceback
    client = TestClient(app, raise_server_exceptions=True)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\nCalling GET /api/dashboard ...")
    try:
        response = client.get("/api/dashboard", headers=headers)
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print("\n!!! CAUGHT EXCEPTION !!!")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reproduce()
