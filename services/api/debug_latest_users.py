import asyncio
import os
import sys

from sqlalchemy import select, text

# Add current dir to path
sys.path.append(os.getcwd())

from app.db.models import User
from app.db.session import async_session_factory


async def debug_latest_users():
    async with async_session_factory() as db:
        print("\n=== LATEST 5 USERS IN DB (Raw SQL to bypass filters) ===")
        # Use raw SQL to bypass any ORM hooks (soft delete, tenant filter)
        result = await db.execute(text("""
            SELECT id, email, username, "tenantId", "node_id", "deletedAt", "createdAt" 
            FROM users 
            ORDER BY "createdAt" DESC 
            LIMIT 5
        """))

        rows = result.fetchall()
        for row in rows:
            print(f"ID: {row.id}")
            print(f"Email: {row.email}")
            print(f"Tenant: {row.tenantId}")
            print(f"Node: {row.node_id}")
            print(f"DeletedAt: {row.deletedAt}")
            print(f"CreatedAt: {row.createdAt}")
            print("-" * 30)


if __name__ == "__main__":
    asyncio.run(debug_latest_users())
