import asyncio
from sqlalchemy import create_url, inspect
from sqlalchemy.ext.asyncio import create_async_engine
import os
from dotenv import load_dotenv

load_dotenv()

async def check_columns():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL not found")
        return
    
    # Switch to async driver if needed, but inspect needs sync or a special helper
    # For simplicity, let's use the sync driver for inspection
    sync_url = url.replace("postgresql+asyncpg://", "postgresql://")
    
    from sqlalchemy import create_engine
    engine = create_engine(sync_url)
    inspector = inspect(engine)
    columns = inspector.get_columns("assignment_submissions")
    print(f"Columns for assignment_submissions:")
    for col in columns:
        print(f" - {col['name']} ({col['type']})")

if __name__ == "__main__":
    asyncio.run(check_columns())
