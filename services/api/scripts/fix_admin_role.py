import asyncio

from app.db.models import RoleKey, User
from app.db.session import async_session_factory
from sqlalchemy import select, text


async def main():
    async with async_session_factory() as db:
        result = await db.execute(
            select(User).where(User.email == "admin-a@test.local")
        )
        user = result.scalar_one_or_none()

        if user:
            print(f"Current User: {user.email}")
            print(
                f"Current Active Role: {user.active_role} (Type: {type(user.active_role)})"
            )
            if hasattr(user.active_role, "value"):
                print(f"Current Active Role Value: {user.active_role.value}")

            # Force update to ADMIN
            user.active_role = RoleKey.ADMIN
            user.role = RoleKey.ADMIN

            await db.commit()
            await db.refresh(user)

            print(f"Updated Active Role: {user.active_role}")
            print(f"Updated Active Role Value: {user.active_role.value}")
        else:
            print("User not found")


if __name__ == "__main__":
    asyncio.run(main())
