import asyncio
import os
import sys

from sqlalchemy import desc, select

# Add current dir to path
sys.path.append(os.getcwd())

from app.db.models import User
from app.db.session import async_session_factory


async def list_recent_users():
    async with async_session_factory() as db:
        print("--- Recent Users (Top 5) ---")
        query = select(User).order_by(desc(User.created_at)).limit(5)
        result = await db.execute(query)
        users = result.scalars().all()

        for u in users:
            print(f"ID: {u.id}")
            print(f"Name: {u.first_name} {u.last_name}")
            print(f"Email: {u.email}")
            print(f"Role: {u.role}")
            print(f"Created: {u.created_at}")
            print(f"Node: {u.node_id}")
            print(f"Tenant: {u.tenant_id}")
            print("-" * 20)


if __name__ == "__main__":
    try:
        asyncio.run(list_recent_users())
    except Exception as e:
        print(e)
