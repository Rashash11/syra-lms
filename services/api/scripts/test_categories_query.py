import asyncio

from app.db.hooks import tenant_context
from app.db.models import Category
from app.db.session import async_session_factory
from sqlalchemy import select


async def main():
    token = tenant_context.set(
        "62143487-327a-4280-96a4-f21911acae95"
    )  # Use the tenant ID from logs

    try:
        async with async_session_factory() as db:
            print("Querying categories...")
            query = select(Category)
            result = await db.execute(query)
            cats = result.scalars().all()
            print(f"Found {len(cats)} categories")
            for c in cats:
                print(f" - {c.name}")
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        tenant_context.reset(token)


if __name__ == "__main__":
    asyncio.run(main())
