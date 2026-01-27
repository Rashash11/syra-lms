import asyncio
import os
import sys

# Add the current directory to sys.path so we can import app modules
sys.path.append(os.getcwd())

from app.db.models import User
from app.db.session import close_db, engine, init_db
from sqlalchemy import select, text


async def main():
    await init_db()
    async with engine.begin() as conn:
        # Use text query to be absolutely sure of column names
        result = await conn.execute(
            text('SELECT id, username, role, "activeRole" FROM users')
        )
        print(f"{'ID':<40} {'Username':<30} {'Role':<20} {'Active Role':<20}")
        print("-" * 110)
        for row in result:
            # Row is tuple-like in some versions or object in others, mapped access is safest
            print(
                f"{row.id:<40} {row.username:<30} {row.role:<20} {row.activeRole:<20}"
            )
    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
