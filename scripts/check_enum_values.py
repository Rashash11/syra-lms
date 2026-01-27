import asyncio
import os
import sys

# Add the services/api directory to sys.path
api_path = os.path.join(os.getcwd(), 'services', 'api')
sys.path.append(api_path)

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run():
    # Use the DB URL from services/api/.env but force asyncpg
    db_url = "postgresql+asyncpg://lms_user:password@localhost:5433/lms_db"
    engine = create_async_engine(db_url)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, name FROM auth_role"))
        print(f"Roles: {res.all()}")
        
        res = await conn.execute(text("SELECT \"activeRole\" FROM users LIMIT 1"))
        print(f"Sample user role: {res.all()}")

if __name__ == "__main__":
    asyncio.run(run())
