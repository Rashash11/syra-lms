import asyncio
import sys
import os

# Add services/api to path
sys.path.append(os.path.join(os.getcwd(), 'services', 'api'))

from app.db.session import init_db, close_db, engine
from sqlalchemy import text

async def main():
    print("Starting role fix...")
    try:
        await init_db()
        async with engine.begin() as conn:
            print("Connected to DB.")
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
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
