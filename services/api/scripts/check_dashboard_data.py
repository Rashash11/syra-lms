import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def check():
    url = "postgresql+asyncpg://lms_user:password@localhost:5433/lms_db"
    engine = create_async_engine(url)

    async with engine.connect() as conn:
        print("--- TIMELINE EVENTS ---")
        res = await conn.execute(text('SELECT * FROM "timeline_events" LIMIT 5'))
        print(res.fetchall())

        print("\n--- RECENT COURSES ---")
        res = await conn.execute(
            text(
                'SELECT id, title, createdAt FROM "courses" ORDER BY "createdAt" DESC LIMIT 5'
            )
        )
        print(res.fetchall())

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(check())
