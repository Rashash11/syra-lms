import asyncio
import sys
import os

# Add services/api to sys.path
sys.path.append(os.path.join(os.getcwd(), 'services', 'api'))

from app.db.session import get_db
from app.db.models import User
from app.auth.password import verify_password
from sqlalchemy import select, text

async def verify_admin():
    async for db in get_db():
        result = await db.execute(select(User).where(User.email == 'admin@portal.com'))
        user = result.scalar_one_or_none()
        
        if not user:
            print("User admin@portal.com NOT FOUND")
            return

        print(f"User: {user.email}")
        print(f"Hash: {user.password_hash}")
        
        is_valid = verify_password('Admin123!', user.password_hash)
        print(f"Verify 'Admin123!': {is_valid}")
        
        # Also check admin-a
        result = await db.execute(select(User).where(User.email == 'admin-a@test.local'))
        user_a = result.scalar_one_or_none()
        if user_a:
             print(f"User: {user_a.email}")
             print(f"Hash: {user_a.password_hash}")
             is_valid_a = verify_password('TestPass123!', user_a.password_hash)
             print(f"Verify 'TestPass123!': {is_valid_a}")

if __name__ == "__main__":
    asyncio.run(verify_admin())
