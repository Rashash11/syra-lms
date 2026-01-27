import asyncio
from sqlalchemy import select, text
from app.db.session import get_db
from app.db.models import User

async def list_test_users():
    async for db in get_db():
        result = await db.execute(text('SELECT email, role, "activeRole" FROM "users" LIMIT 10'))
        rows = result.all()
        for row in rows:
            print(f"Email: {row[0]}, Role: {row[1]}, ActiveRole: {row[2]}")
        break

if __name__ == "__main__":
    asyncio.run(list_test_users())
