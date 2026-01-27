import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def check():
    url = "postgresql+asyncpg://lms_user:password@localhost:5433/lms_db"
    engine = create_async_engine(url)

    async with engine.connect() as conn:
        print("--- COURSES COLUMNS ---")
        res = await conn.execute(text('SELECT * FROM "courses" LIMIT 1'))
        keys = res.keys()
        print(f"Columns: {list(keys)}")

        print("\n--- TIMELINE COLUMNS ---")
        res = await conn.execute(text('SELECT * FROM "timeline_events" LIMIT 1'))
        keys = res.keys()
        print(f"Columns: {list(keys)}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(check())
