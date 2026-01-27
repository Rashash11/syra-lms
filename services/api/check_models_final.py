import asyncio

from app.db.models import Base
from app.db.session import get_db_context
from sqlalchemy import select, text


async def check_models():
    print("Checking models...")
    print(f"Total mapped classes: {len(Base.registry.mappers)}")
    for mapper in Base.registry.mappers:
        print(f" - {mapper.class_.__name__}: {mapper.local_table.name}")

    async with get_db_context() as db:
        print("\nChecking database connection...")
        result = await db.execute(text("SELECT 1"))
        print(f"Connection successful: {result.scalar()}")


if __name__ == "__main__":
    import os
    import sys

    sys.path.append(
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    )
    asyncio.run(check_models())
