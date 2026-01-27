import asyncio

from app.db.models import User
from app.db.session import get_db_context
from sqlalchemy import select


async def check_users():
    from app.config import get_settings

    print(f"DB URL: {get_settings().database_url}")
    async with get_db_context() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"Total users in DB: {len(users)}")
        for u in users:
            print(
                f"User: {u.email}, Role: {u.role}, Status: {u.status}, Node: {u.node_id}, Tenant: {u.tenant_id}"
            )


if __name__ == "__main__":
    import os
    import sys

    # Add project root to path
    sys.path.append(
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    )
    asyncio.run(check_users())
