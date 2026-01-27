
import asyncio
from sqlalchemy import select
from app.db.session import async_session_factory
from app.db.models import User

async def test_user():
    async with async_session_factory() as session:
        result = await session.execute(select(User).limit(5))
        users = result.scalars().all()
        if users:
            for user in users:
                print(f"Found user: {user.email}, role={user.active_role}, tenant={user.tenant_id}")
        else:
            print("No users found")

if __name__ == "__main__":
    asyncio.run(test_user())
