
import asyncio
from app.db.session import async_session_factory
from app.rbac.service import get_user_permissions
from sqlalchemy import select
from app.db.models import User

async def test():
    async with async_session_factory() as db:
        # Get first user
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            print("No users found")
            return
        
        print(f"Testing for user: {user.id} ({user.email})")
        try:
            perms = await get_user_permissions(db, user.id)
            print(f"Permissions: {perms}")
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
