import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def check():
    url = "postgresql+asyncpg://lms_user:password@localhost:5433/lms_db"
    engine = create_async_engine(url)

    async with engine.connect() as conn:
        # Check current tenants
        res = await conn.execute(text("SELECT id, name FROM tenants"))
        tenants = res.fetchall()
        print(f"Tenants: {tenants}")

        # Check counts per tenant
        res = await conn.execute(
            text('SELECT "tenantId", count(*) FROM users GROUP BY "tenantId"')
        )
        print(f"Users per tenant: {res.fetchall()}")

        # Check admin user
        res = await conn.execute(
            text(
                "SELECT id, email, \"tenantId\" FROM users WHERE email = 'admin@portal.com'"
            )
        )
        print(f"Admin User: {res.fetchone()}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(check())
