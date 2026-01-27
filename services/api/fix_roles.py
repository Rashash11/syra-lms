import asyncio
import os
import sys

# Add the current directory to sys.path so we can import app modules
sys.path.append(os.getcwd())

from app.db.session import close_db, engine, init_db
from sqlalchemy import text


async def main():
    await init_db()
    async with engine.begin() as conn:
        print("Updating roles...")
        # Update Admin
        await conn.execute(
            text(
                "UPDATE users SET role='ADMIN', \"activeRole\"='ADMIN' WHERE email LIKE 'admin%'"
            )
        )
        # Update Instructor
        await conn.execute(
            text(
                "UPDATE users SET role='INSTRUCTOR', \"activeRole\"='INSTRUCTOR' WHERE email LIKE 'instructor%'"
            )
        )
        # Update SuperInstructor
        await conn.execute(
            text(
                "UPDATE users SET role='SUPER_INSTRUCTOR', \"activeRole\"='SUPER_INSTRUCTOR' WHERE email LIKE 'super%'"
            )
        )

        print("Roles updated successfully.")

        # Verify
        result = await conn.execute(
            text('SELECT username, role, "activeRole" FROM users')
        )
        for row in result:
            print(f"User: {row.username}, Role: {row.role}, Active: {row.activeRole}")

    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
