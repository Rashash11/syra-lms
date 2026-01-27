import asyncio
import os
import sys

# Add current dir to path
sys.path.append(os.getcwd())

from app.db.models import User
from app.db.session import async_session_factory
from sqlalchemy import select


async def get_admin():
    async with async_session_factory() as db:
        # Search for any user with ADMIN role
        # Note: Enum handling might require string comparison if raw, but here we use ORM
        # If User.role is Enum, we might need to import RoleKey
        # But let's try raw string first or import
        from app.db.models import RoleKey

        result = await db.execute(
            select(User).where(User.role == RoleKey.ADMIN).limit(1)
        )
        user = result.scalar_one_or_none()
        if user:
            print(f"ID: {user.id}")
            print(f"Tenant: {user.tenant_id}")
            print(f"Role: {user.role}")
            print(f"Node: {user.node_id}")
        else:
            print("No users found")


if __name__ == "__main__":
    try:
        asyncio.run(get_admin())
    except Exception as e:
        print(e)
