import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run():
    url = 'postgresql+asyncpg://lms_user:password@localhost:5433/lms_db'
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        print("--- user_roles ---")
        res = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_roles'"))
        for r in res:
            print(r)
        
        print("\n--- users ---")
        res = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"))
        for r in res:
            print(r)

if __name__ == "__main__":
    asyncio.run(run())
