import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def check():
    url = "postgresql+asyncpg://lms_user:password@localhost:5433/lms_db"
    engine = create_async_engine(url)
    tenant_id = "62143487-327a-4280-96a4-f21911acae95"

    async with engine.connect() as conn:
        print(f"--- DATA FOR TENANT {tenant_id} ---")

        # Courses
        res = await conn.execute(
            text(f'SELECT count(*) FROM "courses" WHERE "tenantId" = \'{tenant_id}\'')
        )
        print(f"Courses count: {res.scalar()}")

        # Timeline
        res = await conn.execute(
            text(
                f'SELECT count(*) FROM "timeline_events" WHERE "tenantId" = \'{tenant_id}\''
            )
        )
        print(f"Timeline events count: {res.scalar()}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(check())
