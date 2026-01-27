import asyncio
import sys
import os

# Add the services/api directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'services', 'api'))

from app.db.session import init_db, close_db, engine
from sqlalchemy import text

async def main():
    await init_db()
    async with engine.begin() as conn:
        print("Updating roles...")
        # Update Admin
        await conn.execute(text("UPDATE users SET role='ADMIN', \"activeRole\"='ADMIN' WHERE email LIKE 'admin%'"))
        # Update Instructor
        await conn.execute(text("UPDATE users SET role='INSTRUCTOR', \"activeRole\"='INSTRUCTOR' WHERE email LIKE 'instructor%'"))
        # Update SuperInstructor
        await conn.execute(text("UPDATE users SET role='SUPER_INSTRUCTOR', \"activeRole\"='SUPER_INSTRUCTOR' WHERE email LIKE 'super%'"))
        
        print("Roles updated successfully.")
        
        # Verify
        result = await conn.execute(text('SELECT username, role, "activeRole" FROM users'))
        for row in result:
            print(f"User: {row.username}, Role: {row.role}, Active: {row.activeRole}")

    await close_db()

if __name__ == "__main__":
    asyncio.run(main())
