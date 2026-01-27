import asyncio
import os
import sys

api_path = os.path.join(os.getcwd(), 'services', 'api')
sys.path.append(api_path)

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run():
    db_url = "postgresql+asyncpg://lms_user:password@localhost:5433/lms_db"
    engine = create_async_engine(db_url)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT email, \"activeRole\", \"role\" FROM users WHERE email = 'admin@portal.com'"))
        print(f"User info: {res.all()}")

if __name__ == "__main__":
    asyncio.run(run())
