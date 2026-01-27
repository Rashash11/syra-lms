import asyncio

from app.db.models import User
from app.db.session import get_db_context
from sqlalchemy import select


async def main():
    async with get_db_context() as db:
        result = await db.execute(
            select(User).where(User.email == "admin-a@test.local")
        )
        user = result.scalar_one_or_none()
        if user:
            print(f"User found: {user.email}")
            print(f"Token Version: {user.token_version}")
            print(f"Active Role: {user.active_role}")
            print(f"Tenant ID: {user.tenant_id}")
        else:
            print("User not found")


if __name__ == "__main__":
    import os
    import sys

    # Add current directory to path so imports work
    sys.path.append(os.getcwd())
    asyncio.run(main())
