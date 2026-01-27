
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

DATABASE_URL = "postgresql+asyncpg://lms_user:password@localhost:5433/lms_db"

async def check():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'assignment_submissions'"))
        columns = [row[0] for row in result]
        print("COLUMNS_START")
        for col in columns:
            print(f"COL: {col}")
        print("COLUMNS_END")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
