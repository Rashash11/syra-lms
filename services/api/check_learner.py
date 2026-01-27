import asyncio

from app.db.models import User
from app.db.session import get_db_context
from sqlalchemy import select


async def main():
    async with get_db_context() as db:
        # Check learner
        result = await db.execute(
            select(User).where(User.email == "learner-a@test.local")
        )
        user = result.scalar_one_or_none()
        if user:
            print(f"Learner found: {user.email}")
            print(f"ID: {user.id}")
            print(f"Active: {user.is_active}")
            print(f"Token Version: {user.token_version}")
            print(f"Tenant ID: {user.tenant_id}")
        else:
            print("Learner NOT found")


if __name__ == "__main__":
    import os
    import sys

    sys.path.append(os.getcwd())
    asyncio.run(main())
