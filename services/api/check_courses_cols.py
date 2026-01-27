
import asyncio
from sqlalchemy import create_all_metadata, inspect
from sqlalchemy.ext.asyncio import create_async_engine

async def check_columns():
    # Use the URL from the .env
    url = "postgresql+asyncpg://lms_user:password@localhost:5433/lms_db"
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        def get_cols(connection):
            i = inspect(connection)
            return [c['name'] for c in i.get_columns('courses')]
        
        cols = await conn.run_sync(get_cols)
        print("Columns in 'courses':", cols)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_columns())
